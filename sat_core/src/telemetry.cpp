#include "telemetry.hpp"
#include <sstream>

namespace sat {

static std::string escape_json(const std::string& s) {
  std::ostringstream oss;
  oss << "\"";
  for (char c : s) {
    if (c == '"') oss << "\\\"";
    else if (c == '\\') oss << "\\\\";
    else if (c == '\n') oss << "\\n";
    else if (c == '\r') oss << "\\r";
    else oss << c;
  }
  oss << "\"";
  return oss.str();
}

std::string TelemetryFrame::to_json() const {
  std::ostringstream oss;
  oss << "{";
  oss << "\"ts_monotonic_ns\":" << ts_monotonic_ns << ",";
  oss << "\"cycle_id\":" << cycle_id << ",";
  oss << "\"cycle_ms\":" << cycle_ms << ",";
  oss << "\"slack_ms\":" << slack_ms << ",";
  oss << "\"deadline_miss\":" << (deadline_miss ? "true" : "false") << ",";
  oss << "\"deadline_miss_total\":" << deadline_miss_total << ",";
  oss << "\"consecutive_miss\":" << consecutive_miss << ",";
  oss << "\"mode\":" << escape_json(mode) << ",";
  oss << "\"faults_bitmask\":" << faults_bitmask << ",";
  oss << "\"faults_list\":[";
  for (size_t i = 0; i < faults_list.size(); ++i) {
    if (i) oss << ",";
    oss << escape_json(faults_list[i]);
  }
  oss << "],";
  oss << "\"attitude\":{\"w\":" << attitude.w << ",\"x\":" << attitude.x
      << ",\"y\":" << attitude.y << ",\"z\":" << attitude.z << "},";
  oss << "\"rates_xyz\":[" << rates_x << "," << rates_y << "," << rates_z
      << "],";
  oss << "\"sensor_status\":{";
  oss << "\"gyro_ok\":" << (gyro_ok ? "true" : "false") << ",";
  oss << "\"star_tracker_ok\":" << (star_tracker_ok ? "true" : "false") << ",";
  oss << "\"last_update_ms\":" << last_star_tracker_update_ms << "},";
  oss << "\"telemetry_drops\":" << telemetry_drops << ",";
  oss << "\"command_queue_depth\":" << command_queue_depth << ",";
  oss << "\"last_command\":" << escape_json(last_command);
  oss << "}";
  return oss.str();
}

}  // namespace sat
