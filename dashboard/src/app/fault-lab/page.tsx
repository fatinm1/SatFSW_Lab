"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCommand } from "@/hooks/use-command";
import { useWsTelemetry } from "@/hooks/use-ws-telemetry";
import { useTelemetryStore } from "@/store/telemetry-store";
import Link from "next/link";

const SCENARIOS = [
  {
    id: "cpu-overload",
    title: "CPU Overload → Deadline Misses → SAFE",
    description:
      "Inject CPU_LOAD to busy-wait inside the loop, causing deadline misses. After 3 consecutive misses, sat_core enters SAFE mode.",
    cmd: "INJECT CPU_LOAD 85 10",
    params: [
      { label: "Busy ms", key: "ms", default: 85, min: 50, max: 95 },
      { label: "Duration (s)", key: "dur", default: 10, min: 1, max: 30 },
    ],
  },
  {
    id: "star-tracker-dropout",
    title: "Star Tracker Dropout → Degraded Estimation",
    description:
      "Inject SENSOR_DROPOUT to simulate star tracker and gyro unavailability. Attitude propagates from rates only.",
    cmd: "INJECT SENSOR_DROPOUT 5",
    params: [
      { label: "Duration (s)", key: "dur", default: 5, min: 1, max: 30 },
    ],
  },
  {
    id: "watchdog",
    title: "Watchdog Trigger Simulation",
    description:
      "The watchdog monitors heartbeat every 250ms. Simulate a stall by injecting heavy CPU load to delay the control loop.",
    cmd: "INJECT CPU_LOAD 95 5",
    params: [
      { label: "Busy ms", key: "ms", default: 95, min: 90, max: 99 },
      { label: "Duration (s)", key: "dur", default: 5, min: 1, max: 15 },
    ],
  },
];

export default function FaultLabPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, number>>({
    ms: 85,
    dur: 10,
    ms2: 95,
    dur2: 5,
    dur3: 5,
  });

  useWsTelemetry();
  const { connected } = useTelemetryStore();
  const { send, loading } = useCommand();

  const buildCmd = (scenario: (typeof SCENARIOS)[0]) => {
    if (scenario.id === "cpu-overload") {
      return `INJECT CPU_LOAD ${params.ms ?? 85} ${params.dur ?? 10}`;
    }
    if (scenario.id === "star-tracker-dropout") {
      return `INJECT SENSOR_DROPOUT ${params.dur3 ?? 5}`;
    }
    if (scenario.id === "watchdog") {
      return `INJECT CPU_LOAD ${params.ms2 ?? 95} ${params.dur2 ?? 5}`;
    }
    return scenario.cmd;
  };

  const runScenario = async (scenario: (typeof SCENARIOS)[0]) => {
    if (!connected || loading) return;
    setRunning(scenario.id);
    const cmd = buildCmd(scenario);
    await send(cmd);
    setRunning(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Mission Control
          </Link>
          <h1 className="text-xl font-bold">Fault Lab</h1>
          <span
            className={`text-sm ${connected ? "text-emerald-500" : "text-amber-500"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </header>

        <div className="space-y-6">
          {SCENARIOS.map((scenario) => (
            <motion.div
              key={scenario.id}
              className="glass rounded-lg p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2">{scenario.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {scenario.description}
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                {scenario.params?.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <label className="text-xs">{p.label}</label>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      value={
                        scenario.id === "star-tracker-dropout"
                          ? params.dur3 ?? p.default
                          : p.key === "ms" && scenario.id === "watchdog"
                            ? params.ms2 ?? p.default
                            : p.key === "dur" && scenario.id === "watchdog"
                              ? params.dur2 ?? p.default
                              : params[p.key] ?? p.default
                      }
                      onChange={(e) =>
                        setParams((s) => ({
                          ...s,
                          ...(scenario.id === "star-tracker-dropout"
                            ? { dur3: +e.target.value }
                            : scenario.id === "watchdog"
                              ? p.key === "ms"
                                ? { ms2: +e.target.value }
                                : { dur2: +e.target.value }
                              : { [p.key]: +e.target.value }),
                        }))
                      }
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {scenario.id === "star-tracker-dropout"
                        ? params.dur3 ?? p.default
                        : scenario.id === "watchdog"
                          ? p.key === "ms"
                            ? params.ms2 ?? p.default
                            : params.dur2 ?? p.default
                          : params[p.key] ?? p.default}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => runScenario(scenario)}
                disabled={!connected || loading || running !== null}
                className="rounded border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              >
                {running === scenario.id ? "Running..." : "Run Scenario"}
              </button>
              <p className="mt-2 text-[10px] text-muted-foreground font-mono">
                {buildCmd(scenario)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
