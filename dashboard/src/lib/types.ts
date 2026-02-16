export interface TelemetryFrame {
  ts_monotonic_ns: number;
  cycle_id: number;
  cycle_ms: number;
  slack_ms: number;
  deadline_miss: boolean;
  deadline_miss_total: number;
  consecutive_miss: number;
  mode: string;
  faults_bitmask: number;
  faults_list: string[];
  attitude: { w: number; x: number; y: number; z: number };
  rates_xyz: [number, number, number];
  sensor_status: {
    gyro_ok: boolean;
    star_tracker_ok: boolean;
    last_update_ms: number;
  };
  telemetry_drops: number;
  command_queue_depth: number;
  last_command: string;
}
