// wsHandlers/leaderboard.js
const redisClient = require("../../redis/redisClient");
const rooms = require("../rooms");
const { broadcastToRoom } = require("../wsUtils");

async function broadcastLeaderboard(roomCode, wss) {
  const roomPlayers = rooms[roomCode] || [];
  const leaderboard = [];

  for (const client of roomPlayers) {
    const userId = client.userId;
    if (userId) {
      const key = `score:${roomCode}:${userId}`;
      const score = await redisClient.get(key) || 0;
      leaderboard.push({ userId, score: parseInt(score) });
    }
  }

  leaderboard.sort((a, b) => b.score - a.score);

  broadcastToRoom(roomCode, {
    type: "LEADERBOARD_UPDATE",
    payload: leaderboard,
  }, wss);

  console.log(`📊 Leaderboard for ${roomCode}:`, leaderboard);
}

module.exports = broadcastLeaderboard;
