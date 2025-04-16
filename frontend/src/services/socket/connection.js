// /services/socket/connection.js
import {
  socketState,
  getSocket,
  isSocketOpen,
  debugSocketState,
  messageListeners,
  messageQueue,
} from "./state";
import { startHeartbeat, stopHeartbeat } from "./heartbeat";
import { flushQueue, sendMessage } from "./messageQueue";
import { handleIncomingMessage } from "./listeners";

const URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const WS_URL = URL.replace(/^http/, "ws");

export function connectSocket({ token, roomCode } = {}) {
  const currentSocket = getSocket();

  if (
    socketState.isConnecting ||
    (currentSocket &&
      (currentSocket.readyState === WebSocket.OPEN ||
        currentSocket.readyState === WebSocket.CONNECTING))
  ) {
    return currentSocket;
  }

  socketState.lastToken = token;
  socketState.lastRoomCode = roomCode;
  socketState.isConnecting = true;
  socketState.manuallyDisconnected = false;

  const newSocket = new WebSocket(`${WS_URL}/ws`);
  socketState.socket = newSocket;

  // ✅ Always bind listeners before onopen to avoid missing early messages
  newSocket.onmessage = handleIncomingMessage;

  newSocket.onopen = () => {
    console.log("[WS] Connected ✅");
    socketState.isConnecting = false;
    socketState.reconnectAttempts = 0;
    startHeartbeat();

    if (socketState.lastToken && socketState.lastRoomCode) {
      sendMessage({
        type: "JOIN_ROOM",
        token: socketState.lastToken,
        roomCode: socketState.lastRoomCode,
      });
    }

    flushQueue();
    clearTimeout(socketState.reconnectTimeout);
    socketState.reconnectTimeout = null;

    // debugSocketState(); // uncomment if you want a snapshot
  };

  newSocket.onclose = () => {
    console.warn("[WS] Disconnected ❌");
    socketState.isConnecting = false;
    stopHeartbeat();

    if (!socketState.manuallyDisconnected) {
      attemptReconnect();
    }
  };

  newSocket.onerror = (err) => {
    console.error("[WS] Error:", err);
    socketState.isConnecting = false;

    if (newSocket.readyState !== WebSocket.CLOSED) {
      newSocket.close(); // triggers onclose and reconnect
    }
  };

  return newSocket;
}

export function disconnectSocket() {
  socketState.manuallyDisconnected = true;
  stopHeartbeat();

  const socket = getSocket();
  if (socket) socket.close();

  socketState.socket = null;
  socketState.reconnectTimeout = null;
  socketState.isConnecting = false;

  // Reset message state (do NOT reassign — mutate in-place)
  messageQueue.length = 0;
  messageListeners.length = 0;

  console.log("[WS] Disconnected manually 🛑");

  // debugSocketState(); // optional
}

function attemptReconnect() {
  if (socketState.reconnectTimeout) return;

  socketState.reconnectAttempts++;
  const delay = Math.min(socketState.reconnectAttempts * 3000, 15000);

  console.log(`[WS] Attempting reconnect in ${delay / 1000}s...`);

  socketState.reconnectTimeout = setTimeout(() => {
    socketState.reconnectTimeout = null;

    if (socketState.reconnectAttempts > 10) {
      console.warn("[WS] Reconnect limit reached 🚫");
      return;
    }

    connectSocket({
      token: socketState.lastToken,
      roomCode: socketState.lastRoomCode,
    });
  }, delay);
}
