const WebSocket = require("ws");
const redisClient = require("../redis/redisClient");

const handleJoinRoom = require("../wsHandlers/joinRoom");
const handleStartGame = require("../wsHandlers/startGame");
const handleScoreUpdate = require("../wsHandlers/score");
const handleDisconnect = require("../wsHandlers/disconnect");

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
          case "HIT_BOMB":
            handleScoreUpdate(data,  wss);
            break;
          default:
            console.log("❓ Unknown message type:", data.type);
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err.message);
      }
    });

    ws.on("close", () => handleDisconnect(ws, wss, redisClient));
  });
}

module.exports = setupWebSocket;
