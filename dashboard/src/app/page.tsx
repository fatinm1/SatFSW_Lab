"use client";

import { useWsTelemetry } from "@/hooks/use-ws-telemetry";
import { useTelemetryStore } from "@/store/telemetry-store";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ModeBadge } from "@/components/ModeBadge";
import { CycleBudgetBar } from "@/components/CycleBudgetBar";
import { AttitudePanel } from "@/components/AttitudePanel";
import { TimingChart } from "@/components/TimingChart";
import { FaultsPanel } from "@/components/FaultsPanel";
import { SensorHealthPanel } from "@/components/SensorHealthPanel";
import { TelemetryJsonPanel } from "@/components/TelemetryJsonPanel";
import Link from "next/link";

export default function MissionControlPage() {
  useWsTelemetry();
  const { latest } = useTelemetryStore();

  const faultCount = latest?.faults_list?.length ?? 0;
  const isSafe = latest?.mode === "SAFE";

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div
        className="mx-auto max-w-7xl space-y-6"
        data-mode={isSafe ? "safe" : undefined}
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight">
              SATFSW Lab
            </h1>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/"
                className="text-primary font-medium"
              >
                Mission Control
              </Link>
              <Link
                href="/console"
                className="text-muted-foreground hover:text-foreground"
              >
                Console
              </Link>
              <Link
                href="/fault-lab"
                className="text-muted-foreground hover:text-foreground"
              >
                Fault Lab
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            {latest && (
              <>
                <ModeBadge mode={latest.mode} />
                <span className="text-xs text-muted-foreground">
                  Faults: {faultCount}
                </span>
                <div className="w-32">
                  <CycleBudgetBar
                    cycleMs={latest.cycle_ms}
                    deadlineMiss={latest.deadline_miss}
                  />
                </div>
              </>
            )}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <AttitudePanel frame={latest} />
            <TimingChart />
            <SensorHealthPanel frame={latest} />
          </div>
          <div className="space-y-6">
            <FaultsPanel frame={latest} />
            <TelemetryJsonPanel frame={latest} />
          </div>
        </main>
      </div>
    </div>
  );
}
