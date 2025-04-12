// /services/socket/heartbeat.js
import { getSocket, socketState } from "./state";

export function startHeartbeat() {
  stopHeartbeat(); // Prevent duplicate intervals

  const interval = setInterval(() => {
    try {
      const socket = getSocket();
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "PING" }));
      }
    } catch (err) {
      console.error("[WS] Failed to send heartbeat PING:", err);
    }
  }, 15000);

  socketState.pingInterval = interval;
}

export function stopHeartbeat() {
  try {
    const interval = socketState.pingInterval;
    if (interval) clearInterval(interval);
  } catch (err) {
    console.warn("[WS] Failed to stop heartbeat:", err);
  } finally {
    socketState.pingInterval = null;
  }
}