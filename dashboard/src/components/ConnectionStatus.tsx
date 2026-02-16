"use client";

import { motion } from "framer-motion";
import { useTelemetryStore } from "@/store/telemetry-store";

export function ConnectionStatus() {
  const { connected } = useTelemetryStore();

  return (
    <div className="flex items-center gap-2">
      <motion.span
        animate={{ scale: connected ? 1 : [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: connected ? 0 : Infinity }}
        className={`inline-block h-2 w-2 rounded-full ${
          connected ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      <span className="text-sm font-medium">
        {connected ? "LIVE" : "CONNECTING..."}
      </span>
    </div>
  );
}
