#include "../src/command.hpp"
#include <cassert>
#include <thread>
int main() {
    assert(sat::parse_command("  ").verb.empty());
    auto c = sat::parse_command("  set_mode SAFE\r\n");
    assert(c.verb == "SET_MODE" && c.args.size() == 1 && c.args[0] == "SAFE");
    sat::CommandQueue q;
    sat::Command out;
    assert(!q.pop(out));
    std::thread a([&] { for (int i=0; i<100; ++i) q.push(sat::parse_command("PING")); });
    std::thread b([&] { for (int i=0; i<100; ++i) q.push(sat::parse_command("STATS")); });
    a.join(); b.join();
    assert(q.size() == 200);
    int count = 0; while(q.pop(out)) ++count;
    assert(count == 200 && q.size() == 0);
}
