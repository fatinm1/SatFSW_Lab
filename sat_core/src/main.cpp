#include "attitude.hpp"
#include "command.hpp"
#include "config.hpp"
#include "faults.hpp"
#include "logger.hpp"
#include "mode.hpp"
#include "sensors.hpp"
#include "telemetry.hpp"
#include "tcp_server.hpp"
#include "udp_sender.hpp"

#include <atomic>
#include <chrono>
#include <csignal>
#include <cstring>
#include <ctime>
#include <sstream>
#include <thread>

#ifdef __linux__
#define _GNU_SOURCE
#include <time.h>
#endif

static std::atomic<bool> g_running{true};

void sig_handler(int) { g_running = false; }

static double to_ms(std::chrono::nanoseconds ns) {
  return ns.count() / 1e6;
}

#ifdef __linux__
static void sleep_until_abs(struct timespec* next) {
  clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, next, nullptr);
}
#endif

int main(int argc, char* argv[]) {
  (void)argc;
  (void)argv;

  std::signal(SIGINT, sig_handler);
  std::signal(SIGTERM, sig_handler);

  sat::Logger::instance().set_level(sat::LogLevel::INFO);
  LOG_INFO("MAIN", "sat_core starting - deterministic 10 Hz flight software");

  sat::CommandQueue cmd_queue;
  sat::TcpCommandServer tcp_server(cmd_queue);
  if (!tcp_server.start()) {
    LOG_ERROR("MAIN", "Failed to start TCP command server");
    return 1;
  }

  sat::UdpSender udp_sender;
  if (!udp_sender.init()) {
    LOG_ERROR("MAIN", "Failed to init UDP sender");
    return 1;
  }

  sat::Sensors sensors;
  sat::Quaternion attitude{1, 0, 0, 0};

  std::atomic<uint32_t> faults_bitmask{0};
  std::atomic<sat::Mode> mode{sat::Mode::NOMINAL};
  std::atomic<uint64_t> heartbeat_ns{0};
  std::atomic<uint32_t> deadline_miss_total{0};
  std::atomic<uint32_t> consecutive_miss{0};
  std::atomic<uint32_t> telemetry_drops{0};
  std::string last_command;

  double cpu_load_ms{0};
  double cpu_load_remaining{0};

  std::thread watchdog_thread([&]() {
    while (g_running) {
      std::this_thread::sleep_for(std::chrono::milliseconds(50));
      uint64_t hb = heartbeat_ns.load();
      if (hb == 0) continue;
      auto now = std::chrono::steady_clock::now();
      uint64_t now_ns =
          std::chrono::duration_cast<std::chrono::nanoseconds>(
              now.time_since_epoch())
              .count();
      uint64_t age_ms = (now_ns - hb) / 1'000'000;
      if (age_ms > sat::Config::WATCHDOG_THRESHOLD_MS) {
        faults_bitmask |= sat::FAULT_WATCHDOG;
        mode = sat::Mode::SAFE;
        LOG_WARN("WATCHDOG", "Heartbeat stale %lu ms - entering SAFE",
                 (unsigned long)age_ms);
      }
    }
  });

#ifdef __linux__
  struct timespec next;
  clock_gettime(CLOCK_MONOTONIC, &next);
  next.tv_nsec += sat::Config::CYCLE_NS;
  if (next.tv_nsec >= 1000000000L) {
    next.tv_sec += next.tv_nsec / 1000000000L;
    next.tv_nsec %= 1000000000L;
  }
#endif

  uint64_t cycle_id = 0;
  uint32_t cycle_consecutive_miss = 0;

  while (g_running) {
    auto cycle_start = std::chrono::steady_clock::now();
    uint64_t ts_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
                         cycle_start.time_since_epoch())
                         .count();
    heartbeat_ns.store(ts_ns);

    bool deadline_miss = false;
    double cycle_ms = 0;

    if (cycle_id > 0) {
      cycle_ms = to_ms(std::chrono::steady_clock::now() - cycle_start);
    }

    double dt_s = 0.1;

    int cmds_processed = 0;
    sat::Command cmd;
    while (cmd_queue.pop(cmd) &&
           cmds_processed < sat::Config::MAX_COMMANDS_PER_CYCLE) {
      cmds_processed++;
      last_command = cmd.raw;

      sat::Mode m = mode.load();
      if (m == sat::Mode::SAFE) {
        if (cmd.verb != "PING" && cmd.verb != "RESET_FAULTS" &&
            cmd.verb != "SET_MODE" && cmd.verb != "STATS") {
          LOG_DEBUG("CMD", "Ignored in SAFE: %s", cmd.raw.c_str());
          continue;
        }
      }

      if (cmd.verb == "PING") {
        LOG_INFO("CMD", "ACK PING");
      } else if (cmd.verb == "SET_MODE") {
        if (cmd.args.size() >= 1) {
          sat::Mode newm = sat::parse_mode(cmd.args[0]);
          mode = newm;
          LOG_INFO("CMD", "Mode set to %s", sat::mode_to_string(newm));
        }
      } else if (cmd.verb == "RESET_FAULTS") {
        uint32_t prev = faults_bitmask.exchange(0);
        if (prev) LOG_INFO("CMD", "Faults reset (was 0x%x)", prev);
      } else if (cmd.verb == "INJECT") {
        if (cmd.args.size() >= 2) {
          std::string inj = cmd.args[0];
          if (inj == "CPU_LOAD" && cmd.args.size() >= 3) {
            double ms = std::stod(cmd.args[1]);
            double dur = std::stod(cmd.args[2]);
            cpu_load_ms = ms;
            cpu_load_remaining = dur;
            faults_bitmask |= sat::FAULT_CPU_LOAD;
            LOG_INFO("CMD", "INJECT CPU_LOAD %.1f ms for %.1f s", ms, dur);
          } else if (inj == "SENSOR_DROPOUT" && cmd.args.size() >= 2) {
            double dur = std::stod(cmd.args[1]);
            sensors.inject_sensor_dropout(dur);
            LOG_INFO("CMD", "INJECT SENSOR_DROPOUT %.1f s", dur);
          } else if (inj == "GYRO_SPIKE" && cmd.args.size() >= 3) {
            double mag = std::stod(cmd.args[1]);
            double dur = std::stod(cmd.args[2]);
            sensors.inject_gyro_spike(mag, dur);
            LOG_INFO("CMD", "INJECT GYRO_SPIKE %.1f deg/s for %.1f s", mag, dur);
          } else if (inj == "POWER_GLITCH" && cmd.args.size() >= 3) {
            (void)std::stod(cmd.args[1]);
            (void)std::stod(cmd.args[2]);
            faults_bitmask |= sat::FAULT_POWER_GLITCH;
            LOG_INFO("CMD", "INJECT POWER_GLITCH");
          }
        }
      } else if (cmd.verb == "SET_TARGET_RATE" && cmd.args.size() >= 3) {
        double x = std::stod(cmd.args[0]);
        double y = std::stod(cmd.args[1]);
        double z = std::stod(cmd.args[2]);
        sensors.set_target_rate(x, y, z);
        LOG_INFO("CMD", "SET_TARGET_RATE %.2f %.2f %.2f", x, y, z);
      } else if (cmd.verb == "STATS") {
        LOG_INFO("STATS", "cycle_id=%lu deadline_miss_total=%u consecutive=%u "
                 "mode=%s faults=0x%x",
                 (unsigned long)cycle_id, deadline_miss_total.load(),
                 consecutive_miss.load(), sat::mode_to_string(mode.load()),
                 faults_bitmask.load());
      }
    }

    if (cpu_load_remaining > 0) {
      double busy_ms = cpu_load_ms;
      if (busy_ms > 90) busy_ms = 90;
      auto t0 = std::chrono::steady_clock::now();
      while (std::chrono::duration_cast<std::chrono::milliseconds>(
                 std::chrono::steady_clock::now() - t0)
                 .count() < busy_ms) {
        volatile int x = 0;
        for (int i = 0; i < 1000; ++i) x += i;
        (void)x;
      }
      cpu_load_remaining -= 0.1;
      if (cpu_load_remaining <= 0) {
        cpu_load_remaining = 0;
        faults_bitmask &= ~sat::FAULT_CPU_LOAD;
      }
    }

    uint32_t faults = faults_bitmask.load();
    sensors.update(dt_s, cycle_id, faults, faults_bitmask);

    double wx = sensors.get_gyro_x();
    double wy = sensors.get_gyro_y();
    double wz = sensors.get_gyro_z();

    sat::propagate_attitude(attitude, wx, wy, wz, dt_s);

    auto cycle_end = std::chrono::steady_clock::now();
    cycle_ms = to_ms(cycle_end - cycle_start);

    double slack_ms = 100.0 - cycle_ms;

    if (cycle_ms > 100.0) {
      deadline_miss = true;
      deadline_miss_total++;
      cycle_consecutive_miss++;
      if (cycle_consecutive_miss >= sat::Config::CONSECUTIVE_MISS_SAFE_THRESHOLD) {
        faults_bitmask |= sat::FAULT_DEADLINE;
        mode = sat::Mode::SAFE;
        consecutive_miss.store(cycle_consecutive_miss);
        LOG_WARN("MAIN", "Consecutive deadline misses %u - entering SAFE",
                 cycle_consecutive_miss);
      }
    } else {
      cycle_consecutive_miss = 0;
      consecutive_miss.store(0);
    }

    sat::TelemetryFrame frame;
    frame.ts_monotonic_ns = static_cast<int64_t>(ts_ns);
    frame.cycle_id = cycle_id;
    frame.cycle_ms = cycle_ms;
    frame.slack_ms = slack_ms;
    frame.deadline_miss = deadline_miss;
    frame.deadline_miss_total = deadline_miss_total.load();
    frame.consecutive_miss = consecutive_miss.load();
    frame.mode = sat::mode_to_string(mode.load());
    frame.faults_bitmask = faults_bitmask.load();
    sat::fault_bitmask_to_list(frame.faults_bitmask, frame.faults_list);
    frame.attitude = attitude;
    frame.rates_x = wx;
    frame.rates_y = wy;
    frame.rates_z = wz;
    frame.gyro_ok = sensors.get_status().gyro_ok;
    frame.star_tracker_ok = sensors.get_status().star_tracker_ok;
    frame.last_star_tracker_update_ms =
        sensors.get_status().last_star_tracker_update_ms;
    frame.telemetry_drops = telemetry_drops.load();
    frame.command_queue_depth = cmd_queue.size();
    frame.last_command = last_command;

    std::string json = frame.to_json();
    udp_sender.send(json);

    cycle_id++;

#ifdef __linux__
    next.tv_nsec += sat::Config::CYCLE_NS;
    while (next.tv_nsec >= 1000000000L) {
      next.tv_sec++;
      next.tv_nsec -= 1000000000L;
    }
    sleep_until_abs(&next);
#else
    auto wake = cycle_start + std::chrono::nanoseconds(sat::Config::CYCLE_NS);
    std::this_thread::sleep_until(wake);
#endif
  }

  g_running = false;
  tcp_server.stop();
  tcp_server.join();
  if (watchdog_thread.joinable()) watchdog_thread.join();

  LOG_INFO("MAIN", "sat_core shutdown");
  return 0;
}
