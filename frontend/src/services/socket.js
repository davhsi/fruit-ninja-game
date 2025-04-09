let socket = null;
let pingInterval = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
let messageListeners = [];

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WS_URL = URL.replace(/^http/, "ws");

export function connectSocket({ token, roomCode } = {}) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    console.log("[WS] ✅ Reusing existing socket");
    return socket;
  }

  socket = new WebSocket(`${WS_URL}/ws`);

  socket.onopen = () => {
    console.log("[WS] 🔌 Connected");
    reconnectAttempts = 0;
    startHeartbeat();

    if (token && roomCode) {
      sendMessage({ type: "JOIN_ROOM", token, roomCode });
    }

    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  socket.onclose = () => {
    console.warn("[WS] ❌ Disconnected");
    stopHeartbeat();

    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        reconnectAttempts++;
        if (reconnectAttempts > 10) {
          console.warn("[WS] 🚫 Too many reconnect attempts. Giving up.");
          clearInterval(reconnectInterval);
          reconnectInterval = null;
          return;
        }

        console.log(`[WS] 🔄 Attempting reconnect #${reconnectAttempts}`);
        connectSocket({ token, roomCode });
      }, 3000);
    }
  };

  socket.onerror = (err) => {
    console.error("[WS] 💥 Error:", err);
    if (socket.readyState !== WebSocket.CLOSED) {
      socket.close(); // force reconnect
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("🔔 Incoming:", data?.type, data); // GLOBAL message log
      messageListeners.forEach((cb) => cb(data));
    } catch (err) {
      console.error("[WS] ❌ Failed to parse message:", err);
    }
  };

  return socket;
}

export function sendMessage(message) {
  if (socket?.readyState === WebSocket.OPEN) {
    console.log("[WS] 🔼 Sending:", message?.type, message);
    socket.send(JSON.stringify(message));
  } else {
    console.warn("[WS] ❌ Cannot send, socket not open:", message?.type);
  }
}

export function onMessage(callback) {
  if (!messageListeners.includes(callback)) {
    messageListeners.push(callback);
  }

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

export function getSocket() {
  return socket;
}

function startHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      console.log("[WS] 💓 Sent heartbeat PING");
    }
  }, 15000); // every 15s
}

function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}
