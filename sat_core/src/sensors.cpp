#include "sensors.hpp"
#include "logger.hpp"
#include <algorithm>
#include <chrono>

namespace sat {

Sensors::Sensors()
    : rng_(static_cast<unsigned>(
          std::chrono::steady_clock::now().time_since_epoch().count())) {}

void Sensors::update(double dt_s, uint64_t cycle_id, uint32_t faults_bitmask,
                     std::atomic<uint32_t>& fault_mask) {
  (void)cycle_id;

  if (sensor_dropout_remaining_ > 0) {
    sensor_dropout_remaining_ -= dt_s * 1000;  // dt in ms
    if (sensor_dropout_remaining_ <= 0) {
      sensor_dropout_remaining_ = 0;
      status_.star_tracker_ok = true;
      status_.gyro_ok = true;
      fault_mask &= ~(FAULT_SENSOR_DROPOUT);
      LOG_INFO("SENSORS", "Sensor dropout cleared");
    } else {
      status_.star_tracker_ok = false;
      status_.gyro_ok = false;
      status_.last_star_tracker_update_ms = 9999;
      fault_mask |= FAULT_SENSOR_DROPOUT;
      return;
    }
  }

  double gx = target_rate_x_ + noise_(rng_);
  double gy = target_rate_y_ + noise_(rng_);
  double gz = target_rate_z_ + noise_(rng_);

  if (gyro_spike_remaining_ > 0) {
    gyro_spike_remaining_ -= dt_s;
    double spike = gyro_spike_mag_ * (gyro_spike_remaining_ / 0.1);
    if (spike < 0.1) spike = gyro_spike_mag_;
    gx += spike;
    gy += spike * 0.5;
    gz += spike * 0.3;
    if (std::abs(gx) > Config::GYRO_SPIKE_THRESHOLD ||
        std::abs(gy) > Config::GYRO_SPIKE_THRESHOLD ||
        std::abs(gz) > Config::GYRO_SPIKE_THRESHOLD) {
      fault_mask |= FAULT_GYRO_SPIKE;
    }
    if (gyro_spike_remaining_ <= 0) {
      gyro_spike_remaining_ = 0;
      gyro_spike_mag_ = 0;
      fault_mask &= ~(FAULT_GYRO_SPIKE);
    }
  }

  gyro_x_ = gx;
  gyro_y_ = gy;
  gyro_z_ = gz;

  status_.gyro_ok = !(faults_bitmask & FAULT_GYRO_SPIKE);
  if (faults_bitmask & FAULT_STAR_TRACKER_DROPOUT) {
    status_.star_tracker_ok = false;
    status_.last_star_tracker_update_ms =
        std::max(status_.last_star_tracker_update_ms + 100, 600);
  } else {
    status_.star_tracker_ok = true;
    status_.last_star_tracker_update_ms = 0;
  }
}

void Sensors::inject_gyro_spike(double magnitude_deg_s, double duration_s) {
  gyro_spike_mag_ = magnitude_deg_s;
  gyro_spike_remaining_ = duration_s;
}

void Sensors::inject_sensor_dropout(double duration_s) {
  sensor_dropout_remaining_ = duration_s * 1000;
  status_.star_tracker_ok = false;
  status_.gyro_ok = false;
}

void Sensors::clear_injections() {
  gyro_spike_mag_ = 0;
  gyro_spike_remaining_ = 0;
  sensor_dropout_remaining_ = 0;
}

}  // namespace sat
