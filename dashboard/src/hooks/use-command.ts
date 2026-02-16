"use client";

import { useCallback, useState } from "react";

const API_URL = "http://127.0.0.1:4000/api/command";

interface CommandResult {
  ack: boolean;
  error?: string;
}

export function useCommand() {
  const [loading, setLoading] = useState(false);
  const [lastAck, setLastAck] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const send = useCallback(async (cmd: string): Promise<CommandResult> => {
    if (!cmd.trim()) return { ack: false, error: "Empty command" };
    setLoading(true);
    setLastAck(null);
    setLastError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd.trim() }),
      });
      const data = (await res.json()) as { ack?: boolean; error?: string };
      if (data.ack) {
        setLastAck(cmd.trim());
        return { ack: true };
      }
      setLastError(data.error ?? "Unknown error");
      return { ack: false, error: data.error };
    } catch (e) {
      const err = e instanceof Error ? e.message : "Network error";
      setLastError(err);
      return { ack: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return { send, loading, lastAck, lastError };
}
