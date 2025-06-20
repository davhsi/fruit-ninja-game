const { getRoom } = require("../rooms");
const { getScore } = require("./scoreManager");
const { sendToRoom } = require("../../utils/sendToRoom");

async function broadcastLeaderboard(roomCode) {
  const room = await getRoom(roomCode);

  if (!room || !Array.isArray(room.players)) {
    console.error("[Leaderboard] ❌ Invalid room structure for %s. Value:", roomCode, room);
    return;
  }

  console.log(`📣 Broadcasting leaderboard for room: ${roomCode}`);

  const leaderboard = [];

  for (const player of room.players) {
    if (!player?.id) continue;

    const score = await getScore(roomCode, player.id);
    console.log(`🔍 Leaderboard Entry | user: ${player.username} (${player.id}), score: ${score}`);

    leaderboard.push({
      userId: player.id,
      username: player.username,
      score,
    });
  }

  leaderboard.sort((a, b) => b.score - a.score);

  sendToRoom(roomCode, {
    type: "LEADERBOARD_UPDATE",
    payload: leaderboard,
  });

  console.log("📊 Final Leaderboard Payload for %s:", roomCode, leaderboard);
}

module.exports = broadcastLeaderboard;
