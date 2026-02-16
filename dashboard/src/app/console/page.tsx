"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useCommand } from "@/hooks/use-command";
import { useWsTelemetry } from "@/hooks/use-ws-telemetry";
import { useTelemetryStore } from "@/store/telemetry-store";
import Link from "next/link";

const QUICK_ACTIONS = [
  { label: "PING", cmd: "PING" },
  { label: "NOMINAL", cmd: "SET_MODE NOMINAL" },
  { label: "SAFE", cmd: "SET_MODE SAFE" },
  { label: "RESET FAULTS", cmd: "RESET_FAULTS" },
  { label: "STATS", cmd: "STATS" },
];

const INJECT_PRESETS = [
  {
    label: "CPU Load 80ms/5s",
    cmd: "INJECT CPU_LOAD 80 5",
  },
  {
    label: "Sensor Dropout 3s",
    cmd: "INJECT SENSOR_DROPOUT 3",
  },
  {
    label: "Gyro Spike 10/2s",
    cmd: "INJECT GYRO_SPIKE 10 2",
  },
];

interface LogEntry {
  ts: string;
  type: "sent" | "ack" | "error";
  text: string;
}

export default function ConsolePage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useWsTelemetry();
  const { connected } = useTelemetryStore();
  const { send, loading, lastAck, lastError } = useCommand();

  const addLog = (type: LogEntry["type"], text: string) => {
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setHistory((h) => [...h.slice(-99), { ts, type, text }]);
  };

  useEffect(() => {
    if (lastAck) addLog("ack", `ACK: ${lastAck}`);
  }, [lastAck]);

  useEffect(() => {
    if (lastError) addLog("error", lastError);
  }, [lastError]);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [history]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    addLog("sent", `> ${cmd}`);
    setCmdHistory((h) => [...h.filter((c) => c !== cmd).slice(-19), cmd]);
    setHistoryIndex(-1);
    setInput("");
    send(cmd);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const idx = historyIndex === -1 ? cmdHistory.length - 1 : historyIndex;
        setHistoryIndex(idx);
        setInput(cmdHistory[idx] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex >= 0) {
        const next = historyIndex - 1;
        setHistoryIndex(next);
        setInput(next >= 0 ? (cmdHistory[next] ?? "") : "");
      }
    }
  };

  const runQuick = (cmd: string) => {
    addLog("sent", `> ${cmd}`);
    setCmdHistory((h) => [...h.filter((c) => c !== cmd).slice(-19), cmd]);
    setInput("");
    send(cmd);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              ← Mission Control
            </Link>
            <h1 className="text-xl font-bold">Console</h1>
          </div>
          <span
            className={`text-sm ${connected ? "text-emerald-500" : "text-amber-500"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </header>

        <div className="glass rounded-lg overflow-hidden">
          <div
            ref={logRef}
            className="h-64 overflow-y-auto p-4 font-mono text-sm space-y-1"
          >
            {history.length === 0 && (
              <p className="text-muted-foreground">Type a command and press Enter.</p>
            )}
            {history.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  entry.type === "sent"
                    ? "text-cyan-400"
                    : entry.type === "ack"
                      ? "text-emerald-500"
                      : "text-amber-500"
                }
              >
                <span className="text-muted-foreground mr-2">[{entry.ts}]</span>
                {entry.text}
              </motion.div>
            ))}
          </div>
          <div className="border-t border-border p-4 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Enter command (e.g. PING, SET_MODE NOMINAL)"
              className="flex-1 rounded bg-muted/50 border border-border px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!connected || loading}
            />
            <button
              onClick={submit}
              disabled={!connected || loading || !input.trim()}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => runQuick(a.cmd)}
                  disabled={!connected || loading}
                  className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Inject Presets</h3>
            <div className="flex flex-wrap gap-2">
              {INJECT_PRESETS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => runQuick(a.cmd)}
                  disabled={!connected || loading}
                  className="rounded border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
