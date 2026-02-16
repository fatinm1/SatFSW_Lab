#pragma once

#include <atomic>
#include <string>
#include <vector>

namespace sat {

enum FaultBit : uint32_t {
  FAULT_NONE = 0,
  FAULT_GYRO_SPIKE = 1u << 0,
  FAULT_STAR_TRACKER_DROPOUT = 1u << 1,
  FAULT_WATCHDOG = 1u << 2,
  FAULT_DEADLINE = 1u << 3,
  FAULT_CPU_LOAD = 1u << 4,
  FAULT_SENSOR_DROPOUT = 1u << 5,
  FAULT_POWER_GLITCH = 1u << 6,
};

inline const char* fault_bit_to_name(uint32_t bit) {
  switch (bit) {
    case FAULT_GYRO_SPIKE: return "GYRO_SPIKE";
    case FAULT_STAR_TRACKER_DROPOUT: return "STAR_TRACKER_DROPOUT";
    case FAULT_WATCHDOG: return "WATCHDOG";
    case FAULT_DEADLINE: return "DEADLINE";
    case FAULT_CPU_LOAD: return "CPU_LOAD";
    case FAULT_SENSOR_DROPOUT: return "SENSOR_DROPOUT";
    case FAULT_POWER_GLITCH: return "POWER_GLITCH";
    default: return "UNKNOWN";
  }
}

void fault_bitmask_to_list(uint32_t mask, std::vector<std::string>& out);

}  // namespace sat
