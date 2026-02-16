import dgram from "node:dgram";
import { parseTelemetryLine, type TelemetryFrame } from "./types.js";

const UDP_PORT = 9001;

export function startUdpServer(
  onFrame: (frame: TelemetryFrame) => void
): dgram.Socket {
  const socket = dgram.createSocket("udp4");

  socket.on("message", (msg) => {
    const line = msg.toString("utf8");
    const frame = parseTelemetryLine(line);
    if (frame) {
      onFrame(frame);
    }
  });

  socket.on("error", (err) => {
    console.error("[UDP] Error:", err.message);
  });

  socket.bind(UDP_PORT, "0.0.0.0", () => {
    console.log(`[UDP] Listening on 0.0.0.0:${UDP_PORT}`);
  });

  return socket;
}
