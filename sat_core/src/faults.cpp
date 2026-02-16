#include "faults.hpp"

namespace sat {

void fault_bitmask_to_list(uint32_t mask, std::vector<std::string>& out) {
  out.clear();
  uint32_t b = 1;
  for (int i = 0; i < 32 && b <= mask; ++i, b <<= 1) {
    if (mask & b) {
      out.push_back(fault_bit_to_name(b));
    }
  }
}

}  // namespace sat
