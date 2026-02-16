#pragma once

#include <atomic>
#include <string>

namespace sat {

enum class Mode { NOMINAL, SAFE };

inline const char* mode_to_string(Mode m) {
  return m == Mode::NOMINAL ? "NOMINAL" : "SAFE";
}

inline Mode parse_mode(const std::string& s) {
  if (s == "NOMINAL" || s == "nominal") return Mode::NOMINAL;
  return Mode::SAFE;
}

}  // namespace sat
