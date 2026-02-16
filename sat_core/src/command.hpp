#pragma once

#include "mode.hpp"
#include <mutex>
#include <queue>
#include <string>
#include <vector>

namespace sat {

struct Command {
  std::string raw;
  std::string verb;
  std::vector<std::string> args;
};

class CommandQueue {
 public:
  void push(Command cmd) {
    std::lock_guard<std::mutex> lock(mtx_);
    queue_.push(std::move(cmd));
  }

  bool pop(Command& out) {
    std::lock_guard<std::mutex> lock(mtx_);
    if (queue_.empty()) return false;
    out = std::move(queue_.front());
    queue_.pop();
    return true;
  }

  size_t size() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return queue_.size();
  }

 private:
  mutable std::mutex mtx_;
  std::queue<Command> queue_;
};

Command parse_command(const std::string& line);

}  // namespace sat
