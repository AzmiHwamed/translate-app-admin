import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "./apiClient";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
console.log("[chat socket] SOCKET_URL resolved to:", SOCKET_URL);

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (socket) return socket;

  socket = io(`${SOCKET_URL}/support-ws`, {
    autoConnect: false,
    // A function (not a static object) so a refreshed token is picked up on reconnect.
    auth: () => ({ token: tokenStorage.getIdToken() }),
  });

  // TEMP DEBUG — remove once chat is confirmed working.
  socket.on("connect", () => console.log("[chat socket] connected:", socket?.id));
  socket.on("connect_error", (err) => console.error("[chat socket] connect_error:", err.message));
  socket.on("disconnect", (reason) => console.warn("[chat socket] disconnected:", reason));

  return socket;
}

export function connectChatSocket(): Socket {
  const s = getChatSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
}
