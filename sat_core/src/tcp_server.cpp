#include "tcp_server.hpp"
#include "command.hpp"
#include "logger.hpp"
#include <fcntl.h>

namespace sat {

TcpCommandServer::TcpCommandServer(CommandQueue& queue) : queue_(queue) {}

TcpCommandServer::~TcpCommandServer() { stop(); }

bool TcpCommandServer::start() {
  listen_fd_ = socket(AF_INET, SOCK_STREAM, 0);
  if (listen_fd_ < 0) {
    LOG_ERROR("TCP", "socket() failed");
    return false;
  }

  int opt = 1;
  if (setsockopt(listen_fd_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
    LOG_WARN("TCP", "setsockopt SO_REUSEADDR failed");
  }

  struct sockaddr_in addr;
  std::memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_addr.s_addr = inet_addr("127.0.0.1");
  addr.sin_port = htons(Config::TCP_PORT);

  if (bind(listen_fd_, reinterpret_cast<struct sockaddr*>(&addr),
           sizeof(addr)) < 0) {
    LOG_ERROR("TCP", "bind() failed: %s", strerror(errno));
    close(listen_fd_);
    listen_fd_ = -1;
    return false;
  }

  if (listen(listen_fd_, 4) < 0) {
    LOG_ERROR("TCP", "listen() failed");
    close(listen_fd_);
    listen_fd_ = -1;
    return false;
  }

  running_ = true;
  thread_ = std::thread(&TcpCommandServer::run, this);
  LOG_INFO("TCP", "Command server listening on 127.0.0.1:%d", Config::TCP_PORT);
  return true;
}

void TcpCommandServer::stop() {
  running_ = false;
  if (listen_fd_ >= 0) {
    shutdown(listen_fd_, SHUT_RDWR);
    close(listen_fd_);
    listen_fd_ = -1;
  }
}

void TcpCommandServer::join() {
  if (thread_.joinable()) thread_.join();
}

void TcpCommandServer::run() {
  std::vector<pollfd> pfds;
  while (running_ && listen_fd_ >= 0) {
    pfds.clear();
    pfds.push_back({listen_fd_, POLLIN, 0});

    int r = poll(pfds.data(), pfds.size(), 500);
    if (r < 0 && errno != EINTR) break;
    if (r <= 0) continue;

    if (pfds[0].revents & POLLIN) {
      struct sockaddr_in client_addr;
      socklen_t len = sizeof(client_addr);
      int client = accept(listen_fd_,
                          reinterpret_cast<struct sockaddr*>(&client_addr),
                          &len);
      if (client < 0) continue;

      char buf[4096];
      std::string line;
      while (running_) {
        ssize_t n = recv(client, buf, sizeof(buf) - 1, 0);
        if (n <= 0) break;
        buf[n] = '\0';
        line.append(buf);
        size_t pos;
        while ((pos = line.find('\n')) != std::string::npos) {
          std::string cmd_line = line.substr(0, pos);
          line.erase(0, pos + 1);
          size_t end = cmd_line.find_last_not_of("\r\n \t");
          if (end != std::string::npos) cmd_line.erase(end + 1);
          if (!cmd_line.empty()) {
            Command cmd = parse_command(cmd_line);
            if (!cmd.verb.empty()) {
              queue_.push(std::move(cmd));
            }
          }
        }
      }
      close(client);
    }
  }
}

}  // namespace sat
