"use client";

import { motion } from "framer-motion";

interface ModeBadgeProps {
  mode: string;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  const isSafe = mode === "SAFE";
  return (
    <motion.span
      key={mode}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        isSafe
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
      }`}
    >
      {mode}
    </motion.span>
  );
}
