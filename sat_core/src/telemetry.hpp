#pragma once

#include "attitude.hpp"
#include "config.hpp"
#include "faults.hpp"
#include "sensors.hpp"
#include <atomic>
#include <chrono>
#include <cstdint>
#include <string>
#include <vector>

namespace sat {

struct TelemetryFrame {
  int64_t ts_monotonic_ns{0};
  uint64_t cycle_id{0};
  double cycle_ms{0};
  double slack_ms{0};
  bool deadline_miss{false};
  uint32_t deadline_miss_total{0};
  uint32_t consecutive_miss{0};
  std::string mode;
  uint32_t faults_bitmask{0};
  std::vector<std::string> faults_list;
  Quaternion attitude;
  double rates_x{0}, rates_y{0}, rates_z{0};
  bool gyro_ok{true};
  bool star_tracker_ok{true};
  int last_star_tracker_update_ms{0};
  uint32_t telemetry_drops{0};
  size_t command_queue_depth{0};
  std::string last_command;

  std::string to_json() const;
};

}  // namespace sat
