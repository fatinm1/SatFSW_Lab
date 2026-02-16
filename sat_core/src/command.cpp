#include "command.hpp"
#include <algorithm>
#include <sstream>

namespace sat {

static std::string trim(const std::string& s) {
  auto start = s.find_first_not_of(" \t\r\n");
  if (start == std::string::npos) return "";
  auto end = s.find_last_not_of(" \t\r\n");
  return s.substr(start, end - start + 1);
}

static std::string toupper(const std::string& s) {
  std::string out = s;
  std::transform(out.begin(), out.end(), out.begin(),
                 [](unsigned char c) { return static_cast<char>(std::toupper(c)); });
  return out;
}

Command parse_command(const std::string& line) {
  Command cmd;
  cmd.raw = trim(line);
  if (cmd.raw.empty()) return cmd;

  std::istringstream iss(cmd.raw);
  std::string tok;
  bool first = true;
  while (iss >> tok) {
    std::string t = trim(tok);
    if (t.empty()) continue;
    if (first) {
      cmd.verb = toupper(t);
      first = false;
    } else {
      cmd.args.push_back(t);
    }
  }
  return cmd;
}

}  // namespace sat
