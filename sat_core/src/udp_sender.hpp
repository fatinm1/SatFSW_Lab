#pragma once

#include "config.hpp"
#include <string>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstring>
#include <errno.h>

namespace sat {

class UdpSender {
 public:
  UdpSender() : sock_(-1) {}

  bool init() {
    sock_ = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock_ < 0) return false;
    std::memset(&addr_, 0, sizeof(addr_));
    addr_.sin_family = AF_INET;
    addr_.sin_port = htons(Config::UDP_PORT);
    if (inet_pton(AF_INET, Config::UDP_HOST, &addr_.sin_addr) <= 0) {
      close(sock_);
      sock_ = -1;
      return false;
    }
    return true;
  }

  void send(const std::string& payload) {
    if (sock_ < 0) return;
    sendto(sock_, payload.data(), payload.size(), 0,
           reinterpret_cast<struct sockaddr*>(&addr_), sizeof(addr_));
  }

  ~UdpSender() {
    if (sock_ >= 0) close(sock_);
  }

 private:
  int sock_;
  struct sockaddr_in addr_;
};

}  // namespace sat
