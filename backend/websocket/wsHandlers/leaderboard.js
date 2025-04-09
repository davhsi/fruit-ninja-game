
// websocket/wsHandlers/leaderboard.js
const rooms = require("../rooms");
const scores = require("./score");
const { sendToRoom } = require("../../utils/sendToRoom");
async function broadcastLeaderboard(roomCode, wss) {
  const room = rooms[roomCode];

  if (!room || !Array.isArray(room.players)) {
    console.error(`[Leaderboard] ❌ Invalid room structure for ${roomCode}. Value:`, room);
    return;
  }

  const leaderboard = [];

  for (const player of room.players) {
    const userId = player.id;
    const username = player.username;

    if (userId) {
      const score = scores.getScore(roomCode, userId) || 0;
      leaderboard.push({
        userId,
        username,
        score,
      });
    }
  }

  leaderboard.sort((a, b) => b.score - a.score);

  sendToRoom(
    roomCode,
    {
      type: "LEADERBOARD_UPDATE",
      payload: leaderboard,
    },
    wss
  );

  console.log(`📊 Leaderboard for ${roomCode}:`, leaderboard);
}

module.exports = broadcastLeaderboard;