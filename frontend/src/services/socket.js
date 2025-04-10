let socket = null;
let pingInterval = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
let messageListeners = [];
let isConnecting = false;
let manuallyDisconnected = false;
let messageQueue = [];

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WS_URL = URL.replace(/^http/, "ws");

export function connectSocket({ token, roomCode } = {}) {
  if (
    isConnecting ||
    (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))
  ) {
    console.log("[WS] ✅ Already connected or connecting");
    return socket;
  }

  isConnecting = true;
  manuallyDisconnected = false;
  socket = new WebSocket(`${WS_URL}/ws`);

  socket.onopen = () => {
    console.log("[WS] 🔌 Connected");
    isConnecting = false;
    reconnectAttempts = 0;
    startHeartbeat();

    if (token && roomCode) {
      sendMessage({ type: "JOIN_ROOM", token, roomCode });
    }

    // Flush message queue
    while (messageQueue.length > 0 && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(messageQueue.shift()));
    }

    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  socket.onclose = () => {
    console.warn("[WS] ❌ Disconnected");
    isConnecting = false;
    stopHeartbeat();

    if (manuallyDisconnected) return;

    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        reconnectAttempts++;
        const delay = Math.min(reconnectAttempts * 3000, 15000); // exponential backoff up to 15s

        console.log(`[WS] 🔄 Reconnect attempt #${reconnectAttempts} in ${delay / 1000}s`);

        setTimeout(() => {
          if (reconnectAttempts > 10) {
            console.warn("[WS] 🚫 Too many reconnect attempts. Giving up.");
            clearInterval(reconnectInterval);
            reconnectInterval = null;
            return;
          }
          connectSocket({ token, roomCode });
        }, delay);
      }, 3000);
    }
  };

  socket.onerror = (err) => {
    console.error("[WS] 💥 Socket error:", err);
    isConnecting = false;
    if (socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("🔔 Incoming:", data?.type, data);
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
    console.warn("[WS] 📥 Queuing message, socket not open:", message?.type);
    messageQueue.push(message);
  }
}

export function onMessage(callback) {
  if (!messageListeners.includes(callback)) {
    messageListeners.push(callback);
  }

  // Return cleanup function
  return () => {
    messageListeners = messageListeners.filter((cb) => cb !== callback);
  };
}

export function disconnectSocket() {
  manuallyDisconnected = true;
  stopHeartbeat();
  if (socket) {
    socket.close();
    socket = null;
  }

  messageListeners = [];
  reconnectAttempts = 0;
  isConnecting = false;
  messageQueue = [];

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
  }, 15000);
}

function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}
