// /services/socket/messageQueue.js
import { getSocket, isSocketOpen, messageQueue } from "./state";

export function sendMessage(message) {
  try {
    const msgString = JSON.stringify(message);

    if (isSocketOpen()) {
      getSocket().send(msgString);
    } else {
      console.warn("[WS] 📨 Queued message (socket not open):", message);
      messageQueue.push(msgString);

      // 👇 Optionally try flushing in 100ms (could be connecting)
      setTimeout(flushQueue, 100);
    }
  } catch (err) {
    console.error("[WS] ❌ Failed to queue/send message:", err);
  }
}

export function flushQueue() {
  const socket = getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log("[WS] ⏳ Cannot flush — socket not open");
    return;
  }

  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();

    try {
      socket.send(msg);
    } catch (err) {
      console.error("[WS] ❌ Failed to flush message:", err);
      messageQueue.unshift(msg); // ⛔ Push back, retry later
      break;
    }
  }
}
