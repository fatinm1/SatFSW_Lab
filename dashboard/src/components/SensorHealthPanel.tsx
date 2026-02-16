"use client";

import { motion } from "framer-motion";
import type { TelemetryFrame } from "@/lib/types";

interface SensorHealthPanelProps {
  frame: TelemetryFrame | null;
}

export function SensorHealthPanel({ frame }: SensorHealthPanelProps) {
  if (!frame) {
    return (
      <div className="glass rounded-lg p-4 h-24 flex items-center justify-center text-muted-foreground">
        No telemetry
      </div>
    );
  }

  const ss = frame.sensor_status ?? {
    gyro_ok: true,
    star_tracker_ok: true,
    last_update_ms: 0,
  };

  return (
    <motion.div
      className="glass rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Sensor Health
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs">Gyro</span>
          <span
            className={`text-xs font-medium ${
              ss.gyro_ok ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {ss.gyro_ok ? "OK" : "DEGRADED"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs">Star Tracker</span>
          <span
            className={`text-xs font-medium ${
              ss.star_tracker_ok ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {ss.star_tracker_ok ? "OK" : "DROPOUT"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs">Last ST update</span>
          <span className="text-xs text-muted-foreground">
            {ss.last_update_ms}ms
          </span>
        </div>
      </div>
    </motion.div>
  );
}
