const WebSocket = require("ws");

// Redis-powered WebSocket Handlers
const getMatchHistory = require("./wsHandlers/getMatchHistory");
const endGame = require("./wsHandlers/endGame");
const handleJoinRoom = require("./wsHandlers/joinRoom");
const handleStartGame = require("./wsHandlers/startGame");
const { updateScore } = require("./wsHandlers/scoreManager");
const handleDisconnect = require("./wsHandlers/disconnect");
const broadcastLeaderboard = require("./wsHandlers/leaderboard");

const activeFruitIntervals = {}; // Local only

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  console.log("✅ WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("🔌 New client connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        const { type, roomCode, userId, token, duration } = data;

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
            console.log("🍉 HIT_FRUIT from", userId, "in room", roomCode);
            await updateScore(roomCode, userId, 1);
            broadcastLeaderboard(roomCode);
            break;

          case "HIT_BOMB":
            await updateScore(roomCode, userId, -1);
            broadcastLeaderboard(roomCode);
            break;

          case "GET_MATCH_HISTORY":
            getMatchHistory(data, ws);
            break;

          case "END_GAME":
            if (roomCode && activeFruitIntervals[roomCode]) {
              clearInterval(activeFruitIntervals[roomCode]);
              delete activeFruitIntervals[roomCode];
            }
            await endGame(roomCode, duration, new Date(), wss);
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
      handleDisconnect(ws, wss, activeFruitIntervals); // Pass activeFruitIntervals
    });
  });
}

module.exports = setupWebSocket;