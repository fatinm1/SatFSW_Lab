#pragma once

#include <array>
#include <cmath>

namespace sat {

// Quaternion [w, x, y, z]
struct Quaternion {
  double w{1}, x{0}, y{0}, z{0};

  void normalize() {
    double n = std::sqrt(w * w + x * x + y * y + z * z);
    if (n > 1e-10) {
      w /= n;
      x /= n;
      y /= n;
      z /= n;
    }
  }
};

// Euler angles (deg): roll, pitch, yaw
struct EulerDeg {
  double roll{0}, pitch{0}, yaw{0};
};

EulerDeg quat_to_euler_deg(const Quaternion& q);
Quaternion euler_deg_to_quat(double roll, double pitch, double yaw);
void propagate_attitude(Quaternion& q, double wx, double wy, double wz,
                       double dt_s);

}  // namespace sat
