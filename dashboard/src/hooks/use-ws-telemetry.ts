"use client";

import { useEffect, useRef } from "react";
import { useTelemetryStore } from "@/store/telemetry-store";
import type { TelemetryFrame } from "@/lib/types";

const WS_URL = "ws://127.0.0.1:4000/ws";
const RECONNECT_DELAY_MS = 3000;

export function useWsTelemetry() {
  const { setLatest, setConnected } = useTelemetryStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const frame = JSON.parse(e.data as string) as TelemetryFrame;
          if (frame && typeof frame.cycle_id === "number") {
            setLatest(frame);
          }
        } catch {
          //
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [setLatest, setConnected]);
}
