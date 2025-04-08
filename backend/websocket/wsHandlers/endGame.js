const { broadcastToRoom } = require("../wsUtils");
const redisClient = require("../../redis/redisClient");
const rooms = require("../rooms");
const db = require("../../services/db/dbService");

async function endGame(roomCode, duration, startTime, wss) {
  const roomPlayers = Array.isArray(rooms[roomCode]) ? rooms[roomCode] : [];
  const leaderboard = [];
  const endTime = new Date();

  // ✅ Close all player WebSockets
  for (let player of roomPlayers) {
    if (player.socket && player.socket.readyState === 1) {
      player.socket.close();
    }
  }

  // ✅ Gather scores from Redis
  for (let player of roomPlayers) {
    const userId = player.id;
    if (userId) {
      const key = `score:${roomCode}:${userId}`;
      const score = await redisClient.get(key) || 0;
      leaderboard.push({ userId, score: parseInt(score) });
    }
  }

  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);
  const winner = leaderboard[0]?.userId;

  // Save match result to DB
  await db.saveMatch({
    roomId: roomCode,
    players: leaderboard,
    duration,
    startTime,
    endTime,
    winner,
  });

  // Notify players
  broadcastToRoom(roomCode, {
    type: "END_GAME",
    payload: { leaderboard },
  }, wss);

  console.log("🏁 Game Over. Final leaderboard:", leaderboard);
}

module.exports = endGame;
