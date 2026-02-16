#include "attitude.hpp"
#include <cmath>

namespace sat {

static double deg2rad(double d) { return d * M_PI / 180.0; }
static double rad2deg(double r) { return r * 180.0 / M_PI; }

EulerDeg quat_to_euler_deg(const Quaternion& q) {
  EulerDeg e;
  double sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
  double cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  e.roll = rad2deg(std::atan2(sinr_cosp, cosr_cosp));

  double sinp = 2 * (q.w * q.y - q.z * q.x);
  if (std::abs(sinp) >= 1)
    e.pitch = rad2deg(std::copysign(M_PI / 2, sinp));
  else
    e.pitch = rad2deg(std::asin(sinp));

  double siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  double cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  e.yaw = rad2deg(std::atan2(siny_cosp, cosy_cosp));

  return e;
}

Quaternion euler_deg_to_quat(double roll, double pitch, double yaw) {
  double cr = std::cos(deg2rad(roll) / 2);
  double sr = std::sin(deg2rad(roll) / 2);
  double cp = std::cos(deg2rad(pitch) / 2);
  double sp = std::sin(deg2rad(pitch) / 2);
  double cy = std::cos(deg2rad(yaw) / 2);
  double sy = std::sin(deg2rad(yaw) / 2);

  Quaternion q;
  q.w = cr * cp * cy + sr * sp * sy;
  q.x = sr * cp * cy - cr * sp * sy;
  q.y = cr * sp * cy + sr * cp * sy;
  q.z = cr * cp * sy - sr * sp * cy;
  q.normalize();
  return q;
}

void propagate_attitude(Quaternion& q, double wx, double wy, double wz,
                       double dt_s) {
  double wx_r = deg2rad(wx);
  double wy_r = deg2rad(wy);
  double wz_r = deg2rad(wz);

  double omega = std::sqrt(wx_r * wx_r + wy_r * wy_r + wz_r * wz_r);
  if (omega < 1e-12) return;

  double ha = omega * dt_s / 2;
  double s = std::sin(ha) / omega;

  double dq0 = std::cos(ha);
  double dq1 = wx_r * s;
  double dq2 = wy_r * s;
  double dq3 = wz_r * s;

  Quaternion dq{dq0, dq1, dq2, dq3};
  double nw = q.w * dq.w - q.x * dq.x - q.y * dq.y - q.z * dq.z;
  double nx = q.w * dq.x + q.x * dq.w + q.y * dq.z - q.z * dq.y;
  double ny = q.w * dq.y - q.x * dq.z + q.y * dq.w + q.z * dq.x;
  double nz = q.w * dq.z + q.x * dq.y - q.y * dq.x + q.z * dq.w;

  q.w = nw;
  q.x = nx;
  q.y = ny;
  q.z = nz;
  q.normalize();
}

}  // namespace sat
