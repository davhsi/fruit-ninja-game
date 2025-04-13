const rooms = require("../rooms");
const scores = require("./scoreManager");
const { sendToRoom } = require("../../utils/sendToRoom");

function broadcastLeaderboard(roomCode) {
  const room = rooms[roomCode];

  if (!room || !Array.isArray(room.players)) {
    console.error(`[Leaderboard] ❌ Invalid room structure for ${roomCode}. Value:`, room);
    return;
  }

  console.log(`📣 Broadcasting leaderboard for room: ${roomCode}`);

  const leaderboard = room.players
    .filter(player => player.id)
    .map(player => {
      const score = scores.getScore(roomCode, player.id);
      console.log(`🔍 Leaderboard Entry | user: ${player.username} (${player.id}), score: ${score}`);
      return {
        userId: player.id,
        username: player.username,
        score: score,
      };
    })
    .sort((a, b) => b.score - a.score);

  sendToRoom(roomCode, {
    type: "LEADERBOARD_UPDATE",
    payload: leaderboard,
  });

  console.log(`📊 Final Leaderboard Payload for ${roomCode}:`, leaderboard);
}

module.exports = broadcastLeaderboard;
