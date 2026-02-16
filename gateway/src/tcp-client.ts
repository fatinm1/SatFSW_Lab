import net from "node:net";

const TCP_HOST = "127.0.0.1";
const TCP_PORT = 9000;
const RECONNECT_DELAY_MS = 2000;

export type TcpCommandCallback = (ack: boolean, err?: string) => void;

let socket: net.Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let connected = false;

function connect(): net.Socket {
  const s = net.createConnection(
    { host: TCP_HOST, port: TCP_PORT },
    () => {
      connected = true;
      console.log("[TCP] Connected to sat_core at 127.0.0.1:9000");
      reconnectTimer = null;
    }
  );

  s.setEncoding("utf8");

  s.on("error", (err) => {
    console.error("[TCP] Error:", err.message);
    connected = false;
  });

  s.on("close", () => {
    connected = false;
    socket = null;
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        console.log("[TCP] Reconnecting...");
        connect();
      }, RECONNECT_DELAY_MS);
    }
  });

  return s;
}

export function initTcpClient(): void {
  socket = connect();
}

export function sendCommand(command: string, cb: TcpCommandCallback): void {
  const normalized = command.trim() + "\n";
  if (!socket || !connected) {
    socket = connect();
  }
  socket.write(normalized, (err) => {
    if (err) {
      cb(false, err.message);
    } else {
      cb(true);
    }
  });
}

export function isTcpConnected(): boolean {
  return connected && socket !== null && !socket.destroyed;
}
