"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTelemetryStore } from "@/store/telemetry-store";

export function TimingChart() {
  const { history } = useTelemetryStore();

  const data = useMemo(
    () =>
      history.map((f, i) => ({
        cycle: f.cycle_id,
        cycleMs: f.cycle_ms,
        miss: f.deadline_miss ? f.cycle_ms : null,
      })),
    [history]
  );

  if (data.length === 0) {
    return (
      <div className="glass rounded-lg p-4 h-64 flex items-center justify-center text-muted-foreground">
        No timing data yet
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Cycle Duration (ms)
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="cycle"
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              domain={[0, "dataMax + 20"]}
            />
            <ReferenceLine y={100} stroke="hsl(38 92% 50%)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => [value?.toFixed(1) ?? "-", "ms"]}
            />
            <Line
              type="monotone"
              dataKey="cycleMs"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
