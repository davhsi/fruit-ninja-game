let socket = null;
let pingInterval = null;
let reconnectInterval = null;
let messageListeners = [];

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WS_URL = URL.replace(/^http/, "ws");

export function connectSocket({ token, roomCode } = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  socket = new WebSocket(`${WS_URL}/ws`);

  socket.onopen = () => {
    console.log("[WS] Connected ✅");
    startHeartbeat();

    // 🔥 Log & send JOIN_ROOM if data provided
    if (token && roomCode) {
      const joinPayload = {
        type: "JOIN_ROOM",
        token,
        roomCode,
      };
      console.log("📤 Sending JOIN_ROOM:", joinPayload);
      socket.send(JSON.stringify(joinPayload));
    } else {
      console.warn("⚠️ No token or roomCode provided on connect.");
    }

    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  socket.onclose = () => {
    console.warn("[WS] Disconnected ❌");
    stopHeartbeat();

    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        console.log("[WS] Trying to reconnect...");
        connectSocket({ token, roomCode }); // retry with same credentials
      }, 3000);
    }
  };

  socket.onerror = (err) => {
    console.error("[WS] Error:", err);
    socket.close(); // Force reconnect via `onclose`
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      messageListeners.forEach((cb) => cb(data));
    } catch (err) {
      console.error("[WS] Message parse error:", err);
    }
  };

  return socket;
}

export function sendMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn("[WS] Can't send, not connected");
  }
}

export function onMessage(callback) {
  messageListeners.push(callback);
  return () => {
    // Cleanup
    messageListeners = messageListeners.filter((cb) => cb !== callback);
  };
}

export function disconnectSocket() {
  stopHeartbeat();
  if (socket) {
    socket.close();
    socket = null;
  }
  messageListeners = [];
}

function startHeartbeat() {
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
    }
  }, 15000); // ping every 15s
}

function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}
