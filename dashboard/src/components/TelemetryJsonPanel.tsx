"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TelemetryFrame } from "@/lib/types";

interface TelemetryJsonPanelProps {
  frame: TelemetryFrame | null;
}

export function TelemetryJsonPanel({ frame }: TelemetryJsonPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!frame) {
    return (
      <div className="glass rounded-lg p-4 flex items-center justify-center text-muted-foreground">
        No telemetry
      </div>
    );
  }

  const json = JSON.stringify(frame, null, 2);

  return (
    <div className="glass rounded-lg p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
      >
        Telemetry JSON
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-muted-foreground"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 overflow-auto text-[10px] font-mono text-muted-foreground max-h-64"
          >
            {json}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}
