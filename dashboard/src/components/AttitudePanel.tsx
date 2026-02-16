"use client";

import { motion } from "framer-motion";
import type { TelemetryFrame } from "@/lib/types";

function quatToEuler(q: { w: number; x: number; y: number; z: number }) {
  const sinr = 2 * (q.w * q.x + q.y * q.z);
  const cosr = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinr, cosr) * (180 / Math.PI);
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  const pitch =
    Math.abs(sinp) >= 1
      ? Math.sign(sinp) * (Math.PI / 2) * (180 / Math.PI)
      : Math.asin(sinp) * (180 / Math.PI);
  const siny = 2 * (q.w * q.z + q.x * q.y);
  const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(siny, cosy) * (180 / Math.PI);
  return { roll, pitch, yaw };
}

interface AttitudePanelProps {
  frame: TelemetryFrame | null;
}

export function AttitudePanel({ frame }: AttitudePanelProps) {
  if (!frame) {
    return (
      <div className="glass rounded-lg p-4 h-48 flex items-center justify-center text-muted-foreground">
        No telemetry
      </div>
    );
  }

  const euler = quatToEuler(frame.attitude);
  const [rx, ry, rz] = frame.rates_xyz;

  return (
    <motion.div
      className="glass rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Attitude & Rates
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Euler (deg)</p>
          <div className="font-mono text-sm space-y-1">
            <div>Roll: {euler.roll.toFixed(2)}°</div>
            <div>Pitch: {euler.pitch.toFixed(2)}°</div>
            <div>Yaw: {euler.yaw.toFixed(2)}°</div>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">
            Rates (deg/s)
          </p>
          <div className="font-mono text-sm space-y-1">
            <div>ωx: {rx.toFixed(3)}</div>
            <div>ωy: {ry.toFixed(3)}</div>
            <div>ωz: {rz.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
