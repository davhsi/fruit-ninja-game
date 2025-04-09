// setupWebSocket.js
const WebSocket = require("ws");
const rooms = require("./rooms");

// 🔌 Handlers
const handleJoinRoom = require("./wsHandlers/joinRoom");
const handleStartGame = require("./wsHandlers/startGame");
const updateScore = require("./wsHandlers/score");
const handleDisconnect = require("./wsHandlers/disconnect");

// ✅ Add this line to import the initializer
// const { initSendToRoom } = require("../utils/sendToRoom");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // ✅ Initialize sendToRoom with wss
  // initSendToRoom(wss);

  console.log("✅ WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket connection established");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("📨 Received message type:", data.type);

        switch (data.type) {
          case "PING_DEBUG":
            console.log("📬 GOT PING_DEBUG from frontend:", payload);
            break;

          case "PING":
            console.log("💓 Received PING");
            ws.send(JSON.stringify({ type: "PONG" }));
            break;

          case "JOIN_ROOM":
            console.log("📩 Received JOIN_ROOM:", data);
            handleJoinRoom(ws, data, wss); // ✅ pass wss here
            break;

          case "START_GAME":
            handleStartGame(data, wss, ws);
            break;

          case "HIT_FRUIT":
            await updateScore(data.roomCode, data.userId, 1);
            break;

          case "HIT_BOMB":
            await updateScore(data.roomCode, data.userId, -1);
            break;

          default:
            console.log("❓ Unknown message type:", data.type);
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err.message);
      }
    });

    ws.on("close", () => {
      console.log("⚠️ WebSocket connection closed");
      handleDisconnect(ws, wss); // if you store roomId/userId on ws object
    });
  });
}

module.exports = setupWebSocket;
