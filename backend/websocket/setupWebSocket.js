// setupWebSocket.js
const WebSocket = require("ws");
const rooms = require("./rooms");

// 🔌 Handlers
const handleJoinRoom = require("./wsHandlers/joinRoom");
const handleStartGame = require("./wsHandlers/startGame");
const updateScore = require("./wsHandlers/score");
const handleDisconnect = require("./wsHandlers/disconnect");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  console.log("✅ WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket connection established");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "JOIN_ROOM":
            handleJoinRoom(ws, data);
            break;

          case "START_GAME":
            handleStartGame(data, wss);
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
