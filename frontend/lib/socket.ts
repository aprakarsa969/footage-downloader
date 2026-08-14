import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

import { getToken, handleUnauthorized } from "@/lib/api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      auth: { token: getToken() },
      reconnectionAttempts: 5,
    });
    socket.on("connect_error", (error) => {
      if (error.message.toLowerCase().includes("token")) {
        handleUnauthorized();
      } else {
        console.warn("[socket] connect_error:", error.message);
      }
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
