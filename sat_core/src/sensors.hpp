#pragma once

#include "config.hpp"
#include "faults.hpp"
#include <atomic>
#include <cmath>
#include <random>

namespace sat {

struct SensorStatus {
  bool gyro_ok{true};
  bool star_tracker_ok{true};
  int last_star_tracker_update_ms{0};
};

class Sensors {
 public:
  Sensors();

  void update(double dt_s, uint64_t cycle_id,
              uint32_t faults_bitmask,  // for dropout override
              std::atomic<uint32_t>& fault_mask);

  double get_gyro_x() const { return gyro_x_; }
  double get_gyro_y() const { return gyro_y_; }
  double get_gyro_z() const { return gyro_z_; }
  const SensorStatus& get_status() const { return status_; }

  void inject_gyro_spike(double magnitude_deg_s, double duration_s);
  void inject_sensor_dropout(double duration_s);
  void clear_injections();
  void set_target_rate(double x, double y, double z) {
    target_rate_x_ = x;
    target_rate_y_ = y;
    target_rate_z_ = z;
  }

 private:
  double gyro_x_{0}, gyro_y_{0}, gyro_z_{0};
  SensorStatus status_;

  double target_rate_x_{0}, target_rate_y_{0}, target_rate_z_{0};
  std::mt19937 rng_;
  std::normal_distribution<double> noise_{0, 0.01};

  double gyro_spike_mag_{0};
  double gyro_spike_remaining_{0};
  double sensor_dropout_remaining_{0};
};

}  // namespace sat
