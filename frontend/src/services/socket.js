let socket = null;
let pingInterval = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
let isConnecting = false;
let manuallyDisconnected = false;
let messageListeners = [];
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

  try {
    isConnecting = true;
    manuallyDisconnected = false;
    socket = new WebSocket(`${WS_URL}/ws`);

    socket.onopen = () => {
      console.log("[WS] 🔌 Connected to server");
      isConnecting = false;
      reconnectAttempts = 0;
      startHeartbeat();

      if (token && roomCode) {
        sendMessage({ type: "JOIN_ROOM", token, roomCode });
      }

      // Flush queued messages
      while (messageQueue.length > 0 && socket.readyState === WebSocket.OPEN) {
        const msg = messageQueue.shift();
        socket.send(JSON.stringify(msg));
        console.log("[WS] 📤 Flushed queued message:", msg?.type);
      }

      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    socket.onclose = () => {
      console.warn("[WS] ❌ Socket closed");
      isConnecting = false;
      stopHeartbeat();

      if (manuallyDisconnected) return;

      // Start reconnect attempts
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          reconnectAttempts++;
          const delay = Math.min(reconnectAttempts * 3000, 15000); // max 15s

          console.log(`[WS] 🔁 Reconnect attempt #${reconnectAttempts} in ${delay / 1000}s`);

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
        console.log("🔔 Incoming message:", data?.type, data);
        messageListeners.forEach((cb) => cb(data));
      } catch (err) {
        console.error("[WS] ❌ Failed to parse incoming message:", err);
      }
    };
  } catch (err) {
    console.error("[WS] 🛑 Exception in connectSocket:", err);
    isConnecting = false;
  }

  return socket;
}

export function sendMessage(message) {
  try {
    if (socket?.readyState === WebSocket.OPEN) {
      console.log("[WS] 📤 Sending:", message?.type, message);
      socket.send(JSON.stringify(message));
    } else {
      console.warn("[WS] 🕓 Socket not open, queuing:", message?.type);
      messageQueue.push(message);
    }
  } catch (err) {
    console.error("[WS] 💣 sendMessage failed:", err);
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

  console.log("[WS] 📴 Socket manually disconnected and cleaned up");
}

export function getSocket() {
  return socket;
}

function startHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);

  pingInterval = setInterval(() => {
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "PING" }));
        console.log("[WS] 💓 Sent heartbeat PING");
      }
    } catch (err) {
      console.error("[WS] 🫀 Heartbeat error:", err);
    }
  }, 15000);
}

function stopHeartbeat() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}
