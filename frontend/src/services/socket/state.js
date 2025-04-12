// /services/socket/state.js

// Internal variables (never use these directly outside this file)
let _socket = null;
let _pingInterval = null;
let _reconnectTimeout = null;
let _reconnectAttempts = 0;
let _isConnecting = false;
let _manuallyDisconnected = false;

// Exported queues & metadata (✅ mutation-safe, non-reassignable)
export const messageQueue = [];
export const messageListeners = [];

export let lastToken = null;
export let lastRoomCode = null;

// Named state object (used for controlled internal access only)
export const socketState = {
  get socket() {
    return _socket;
  },
  set socket(value) {
    console.log("[WS] socket updated:", value);
    _socket = value;
  },

  get pingInterval() {
    return _pingInterval;
  },
  set pingInterval(value) {
    if (_pingInterval && value !== null) {
      console.log("[WS] Replacing existing pingInterval");
    }
    _pingInterval = value;
  },

  get reconnectTimeout() {
    return _reconnectTimeout;
  },
  set reconnectTimeout(value) {
    _reconnectTimeout = value;
  },

  get reconnectAttempts() {
    return _reconnectAttempts;
  },
  set reconnectAttempts(value) {
    console.log("[WS] Reconnect attempts:", value);
    _reconnectAttempts = value;
  },

  get isConnecting() {
    return _isConnecting;
  },
  set isConnecting(value) {
    _isConnecting = value;
  },

  get manuallyDisconnected() {
    return _manuallyDisconnected;
  },
  set manuallyDisconnected(value) {
    _manuallyDisconnected = value;
  },
};

//
// ✅ Safe accessors — use these instead of directly touching `_socket` or `socketState`
//

export const getSocket = () => _socket;

export const getPingInterval = () => _pingInterval;

export const getReconnectAttempts = () => _reconnectAttempts;

export const isSocketOpen = () =>
  typeof WebSocket !== "undefined" &&
  _socket instanceof WebSocket &&
  _socket.readyState === WebSocket.OPEN;

//
// 🧪 Optional: debugging helper (great for console logs)
//
export const debugSocketState = () => ({
  isOpen: isSocketOpen(),
  socket: _socket,
  reconnectAttempts: _reconnectAttempts,
  isConnecting: _isConnecting,
  manuallyDisconnected: _manuallyDisconnected,
  queueLength: messageQueue.length,
  listenersCount: messageListeners.length,
});
