"use client";

import { motion } from "framer-motion";
import type { TelemetryFrame } from "@/lib/types";

interface FaultsPanelProps {
  frame: TelemetryFrame | null;
}

export function FaultsPanel({ frame }: FaultsPanelProps) {
  if (!frame) {
    return (
      <div className="glass rounded-lg p-4 h-32 flex items-center justify-center text-muted-foreground">
        No telemetry
      </div>
    );
  }

  const faults = frame.faults_list ?? [];
  const count = faults.length;

  return (
    <motion.div
      className="glass rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Faults ({count})
      </h3>
      {count === 0 ? (
        <p className="text-xs text-emerald-500/80">No faults</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {faults.map((f) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40"
            >
              {f}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
