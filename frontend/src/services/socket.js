let socket = null;
let pingInterval = null;
let reconnectInterval = null;
let reconnectAttempts = 0; // ✅ Global
let messageListeners = [];

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WS_URL = URL.replace(/^http/, "ws");

export function connectSocket({ token, roomCode } = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  socket = new WebSocket(`${WS_URL}/ws`);

  socket.onopen = () => {
    console.log("[WS] Connected ✅");
    reconnectAttempts = 0;
    startHeartbeat();

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

    // prevent spamming multiple reconnect intervals
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        reconnectAttempts++;
        if (reconnectAttempts > 10) {
          console.warn("[WS] Too many reconnect attempts. Giving up.");
          clearInterval(reconnectInterval);
          reconnectInterval = null;
          return;
        }

        console.log(`[WS] Reconnect attempt #${reconnectAttempts}...`);
        connectSocket({ token, roomCode });
      }, 3000);
    }
  };

  socket.onerror = (err) => {
    console.error("[WS] Error:", err);
    if (socket.readyState !== WebSocket.CLOSED) {
      socket.close(); // force reconnect flow
    }
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
  reconnectAttempts = 0;
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

function startHeartbeat() {
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
    }
  }, 15000);
}

function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}
