import { create } from "zustand";
import type { TelemetryFrame } from "@/lib/types";

const MAX_HISTORY = 200;

interface TelemetryState {
  latest: TelemetryFrame | null;
  history: TelemetryFrame[];
  connected: boolean;
  setLatest: (frame: TelemetryFrame) => void;
  setConnected: (v: boolean) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  latest: null,
  history: [],
  connected: false,
  setLatest: (frame) =>
    set((s) => ({
      latest: frame,
      history: [...s.history.slice(-(MAX_HISTORY - 1)), frame],
    })),
  setConnected: (v) => set({ connected: v }),
}));
