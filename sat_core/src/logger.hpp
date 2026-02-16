#pragma once

#include <chrono>
#include <cstdarg>
#include <cstdio>
#include <mutex>
#include <string>

namespace sat {

enum class LogLevel { DEBUG, INFO, WARN, ERROR };

class Logger {
 public:
  static Logger& instance() {
    static Logger log;
    return log;
  }

  void set_level(LogLevel level) { level_ = level; }

  void log(LogLevel level, const char* subsystem, const char* fmt, ...) {
    if (level < level_) return;
    std::lock_guard<std::mutex> lock(mtx_);
    auto now = std::chrono::steady_clock::now();
    auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
                  now.time_since_epoch())
                  .count();
    const char* level_str = "???";
    switch (level) {
      case LogLevel::DEBUG: level_str = "DEBUG"; break;
      case LogLevel::INFO: level_str = "INFO"; break;
      case LogLevel::WARN: level_str = "WARN"; break;
      case LogLevel::ERROR: level_str = "ERROR"; break;
    }
    fprintf(stderr, "[%012lld] [%s] [%s] ", (long long)ns, level_str, subsystem);
    va_list args;
    va_start(args, fmt);
    vfprintf(stderr, fmt, args);
    va_end(args);
    fprintf(stderr, "\n");
  }

 private:
  Logger() = default;
  std::mutex mtx_;
  LogLevel level_ = LogLevel::INFO;
};

#define LOG_DEBUG(subsys, ...) \
  sat::Logger::instance().log(sat::LogLevel::DEBUG, subsys, __VA_ARGS__)
#define LOG_INFO(subsys, ...) \
  sat::Logger::instance().log(sat::LogLevel::INFO, subsys, __VA_ARGS__)
#define LOG_WARN(subsys, ...) \
  sat::Logger::instance().log(sat::LogLevel::WARN, subsys, __VA_ARGS__)
#define LOG_ERROR(subsys, ...) \
  sat::Logger::instance().log(sat::LogLevel::ERROR, subsys, __VA_ARGS__)

}  // namespace sat
