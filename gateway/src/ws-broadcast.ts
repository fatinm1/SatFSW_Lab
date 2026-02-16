import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { TelemetryFrame } from "./types.js";

let wss: WebSocketServer | null = null;
let latestFrame: TelemetryFrame | null = null;

export function getLatestFrame(): TelemetryFrame | null {
  return latestFrame;
}

export function broadcastFrame(frame: TelemetryFrame): void {
  latestFrame = frame;
  if (!wss) return;
  const payload = JSON.stringify(frame);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload, (err) => {
          if (err) {
            try {
              ws.terminate();
            } catch {
              //
            }
          }
        });
      } catch {
        try {
          ws.terminate();
        } catch {
          //
        }
      }
    }
  });
}

export function initWsServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("error", () => {});
    if (latestFrame) {
      try {
        ws.send(JSON.stringify(latestFrame), (err) => {
          if (err) console.error("[WS] Send error:", err.message);
        });
      } catch {
        //
      }
    }
  });

  wss.on("error", (err) => {
    console.error("[WS] Error:", err.message);
  });

  return wss;
}
