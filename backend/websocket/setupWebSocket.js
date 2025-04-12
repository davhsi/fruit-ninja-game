const WebSocket = require("ws");
const rooms = require("./rooms");

// WebSocket Handlers
const handleJoinRoom = require("./wsHandlers/joinRoom");
const handleStartGame = require("./wsHandlers/startGame");
const { updateScore } = require("./wsHandlers/scoreManager");
const handleDisconnect = require("./wsHandlers/disconnect");

const activeFruitIntervals = {}; // Store fruit intervals by room

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  console.log("✅ WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("🔌 New client connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        const { type, roomCode, userId, token } = data;

        console.log("📨 Message type:", type);

        switch (type) {
          case "START_GAME":
            handleStartGame(data, wss, ws, activeFruitIntervals);
            break;

          case "PING_DEBUG":
            console.log("📬 PING_DEBUG:", data);
            break;

          case "PING":
            ws.send(JSON.stringify({ type: "PONG" }));
            break;

          case "JOIN_ROOM":
            handleJoinRoom(ws, data, wss);
            break;

          case "HIT_FRUIT":
            await updateScore(roomCode, userId, 1);
            broadcastLeaderboard(roomCode);
            break;

          case "HIT_BOMB":
            await updateScore(roomCode, userId, -1);
            broadcastLeaderboard(roomCode);
            break;

          case "END_GAME":
            if (roomCode && activeFruitIntervals[roomCode]) {
              clearInterval(activeFruitIntervals[roomCode]);
              delete activeFruitIntervals[roomCode];
            }

            // Notify everyone in room
            const { sendToRoom } = require("../utils/sendToRoom");
            sendToRoom(roomCode, {
              type: "END_GAME",
              payload: { roomCode },
            });
            break;

          default:
            console.log("❓ Unknown message type:", type);
        }
      } catch (err) {
        console.error("❌ Failed to parse message:", err.message);
      }
    });

    ws.on("close", () => {
      console.log("⚠️ WebSocket disconnected");
      handleDisconnect(ws, wss);
    });
  });
}

module.exports = setupWebSocket;
