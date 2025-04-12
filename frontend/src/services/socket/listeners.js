let currentListener = null;
const earlyMessages = [];
const lastMessageByType = {}; // 🧠 Cache latest critical messages

// Define which message types should persist and replay
const CRITICAL_TYPES = ["GAME_STARTED", "LEADERBOARD_UPDATE"];

export function onMessage(callback) {
  if (typeof callback !== "function") {
    console.warn("[WS] onMessage received non-function:", callback);
    return () => {};
  }

  console.log("[WS] 🔄 Registering new message listener");
  currentListener = callback;

  // 🔁 Replay the last critical messages
  CRITICAL_TYPES.forEach((type) => {
    const msg = lastMessageByType[type];
    if (msg) {
      console.log("[WS] 🔁 Replaying last", type, "message:", msg);
      try {
        callback(msg);
      } catch (err) {
        console.error("[WS] Critical replay error:", err, msg);
      }
    }
  });

  // ✅ Flush buffered early messages
  while (earlyMessages.length > 0) {
    const msg = earlyMessages.shift();
    try {
      callback(msg);
    } catch (err) {
      console.error("[WS] Buffered callback error:", err, msg);
    }
  }

  return () => {
    console.log("[WS] ❌ Removing current listener");
    if (currentListener === callback) {
      currentListener = null;
    }
  };
}

export function handleIncomingMessage(event) {
  try {
    const data = JSON.parse(event.data);

    // 🧠 Cache the last version of critical messages
    if (CRITICAL_TYPES.includes(data.type)) {
      lastMessageByType[data.type] = data;
    }

    if (!currentListener) {
      console.log("[WS] 🕒 Buffering early message:", data);
      earlyMessages.push(data);
      return;
    }

    try {
      currentListener(data);
    } catch (cbErr) {
      console.error("[WS] Listener callback error:", cbErr);
    }
  } catch (err) {
    console.error("[WS] ❌ Invalid JSON message:", err);
  }
}
