import express from "express";
import { createServer } from "node:http";
import { startUdpServer } from "./udp-server.js";
import {
  broadcastFrame,
  getLatestFrame,
  initWsServer,
} from "./ws-broadcast.js";
import { sendCommand, isTcpConnected, initTcpClient } from "./tcp-client.js";

const HTTP_PORT = 4000;

const app = express();
app.use(express.json());

app.get("/api/status", (_req, res) => {
  const frame = getLatestFrame();
  if (frame) {
    res.json(frame);
  } else {
    res.status(503).json({ error: "No telemetry yet" });
  }
});

app.post("/api/command", (req, res) => {
  const cmd = req.body?.command;
  if (typeof cmd !== "string" || !cmd.trim()) {
    res.status(400).json({ error: "Missing or invalid 'command' field" });
    return;
  }
  const trimmed = cmd.trim();
  if (trimmed.length > 512) {
    res.status(400).json({ error: "Command too long" });
    return;
  }
  if (!isTcpConnected()) {
    res.status(503).json({
      error: "Not connected to sat_core. Is sat_core running?",
      ack: false,
    });
    return;
  }
  sendCommand(trimmed, (ack, err) => {
    if (ack) {
      res.json({ ack: true, command: trimmed });
    } else {
      res.status(502).json({ ack: false, error: err ?? "Command failed" });
    }
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    tcp_connected: isTcpConnected(),
    has_telemetry: getLatestFrame() !== null,
  });
});

// HTTP server for Express + WebSocket upgrade on same port
const httpServer = createServer(app);
initWsServer(httpServer);
initTcpClient();
startUdpServer((frame) => {
  broadcastFrame(frame);
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP] REST + WebSocket on http://127.0.0.1:${HTTP_PORT}`);
  console.log("  GET  /api/status  - latest telemetry");
  console.log("  POST /api/command - send command to sat_core");
  console.log("  WS   /ws          - telemetry stream");
});
