// wsHandlers/endGame.js
const { broadcastToRoom } = require("../wsUtils");
const redisClient = require("../../redis/redisClient");
const rooms = require("../rooms");

async function endGame(roomCode, wss) {
  const roomPlayers = rooms[roomCode] || [];
  const leaderboard = [];

  // Close all sockets in the room (optional)
  for (let ws of roomPlayers) {
    ws.close();
  }

  // Collect final scores
  for (let client of roomPlayers) {
    const userId = client.userId;
    if (userId) {
      const key = `score:${roomCode}:${userId}`;
      const score = await redisClient.get(key) || 0;
      leaderboard.push({ userId, score: parseInt(score) });
    }
  }

  leaderboard.sort((a, b) => b.score - a.score);
  console.log("🏁 Game Over. Final leaderboard:", leaderboard);

  // Broadcast final leaderboard
  broadcastToRoom(roomCode, {
    type: "END_GAME",
    payload: { leaderboard },
  }, wss);
}

module.exports = endGame;
