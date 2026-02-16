#pragma once

#include "command.hpp"
#include "config.hpp"
#include <atomic>
#include <mutex>
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <poll.h>
#include <cstring>
#include <thread>
#include <vector>

namespace sat {

class TcpCommandServer {
 public:
  TcpCommandServer(CommandQueue& queue);
  ~TcpCommandServer();

  bool start();
  void stop();
  void join();

 private:
  void run();

  CommandQueue& queue_;
  int listen_fd_{-1};
  std::atomic<bool> running_{false};
  std::thread thread_;
};

}  // namespace sat
