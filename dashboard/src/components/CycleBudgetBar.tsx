"use client";

import { motion } from "framer-motion";

interface CycleBudgetBarProps {
  cycleMs: number;
  deadlineMiss: boolean;
}

export function CycleBudgetBar({ cycleMs, deadlineMiss }: CycleBudgetBarProps) {
  const pct = Math.min(100, (cycleMs / 100) * 100);
  const overBudget = cycleMs > 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Cycle budget</span>
        <span className={overBudget ? "text-amber-400" : ""}>
          {cycleMs.toFixed(1)}ms / 100ms
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            overBudget ? "bg-amber-500" : "bg-cyan-500"
          }`}
          initial={false}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      {deadlineMiss && (
        <span className="text-[10px] text-amber-400">Deadline miss</span>
      )}
    </div>
  );
}
