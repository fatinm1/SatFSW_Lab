#pragma once

namespace sat {

struct Config {
  static constexpr int CYCLE_HZ = 10;
  static constexpr long CYCLE_NS = 100'000'000L;  // 100ms
  static constexpr long WATCHDOG_THRESHOLD_MS = 250;
  static constexpr int MAX_COMMANDS_PER_CYCLE = 5;
  static constexpr int CONSECUTIVE_MISS_SAFE_THRESHOLD = 3;

  static constexpr int TCP_PORT = 9000;
  static constexpr const char* UDP_HOST = "127.0.0.1";
  static constexpr int UDP_PORT = 9001;

  static constexpr double GYRO_SPIKE_THRESHOLD = 5.0;  // deg/s
  static constexpr int STAR_TRACKER_TIMEOUT_MS = 500;
};

}  // namespace sat
