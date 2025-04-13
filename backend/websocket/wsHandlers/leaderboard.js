//websocket/wsHandlers/leaderboard.js
const rooms = require("../rooms");
const scores = require("./scoreManager"); // ← this now works again
const { sendToRoom } = require("../../utils/sendToRoom");

function broadcastLeaderboard(roomCode) {
  const room = rooms[roomCode];

  if (!room || !Array.isArray(room.players)) {
    console.error(`[Leaderboard] ❌ Invalid room structure for ${roomCode}. Value:`, room);
    return;
  }

  const leaderboard = room.players
    .filter(player => player.id)
    .map(player => ({
      userId: player.id,
      username: player.username,
      score: scores.getScore(roomCode, player.id) || 0,
    }))
    .sort((a, b) => b.score - a.score);

  sendToRoom(roomCode, {
    type: "LEADERBOARD_UPDATE",
    payload: leaderboard,
  });

  console.log(`📊 Leaderboard for ${roomCode}:`, leaderboard);
}

module.exports = broadcastLeaderboard;
