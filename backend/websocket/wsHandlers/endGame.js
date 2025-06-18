const { getRoom, markGameSaved } = require("../rooms");
const db = require("../../services/db/dbService");
const scores = require("./scoreManager");
const { sendToRoom } = require("../../utils/sendToRoom");
const { getSocket } = require("./inMemorySockets");

/**
 * Ends the game, sends final leaderboard, saves match results, and closes sockets (after delay).
 */
async function endGame(roomCode, duration, startTime, wss) {
  const room = await getRoom(roomCode);
  if (!room) return;

  if (room.gameSaved) {
    console.log(`⚠️ Game in room ${roomCode} already saved. Skipping...`);
    return;
  }

  await markGameSaved(roomCode); // ✅ write to Redis to prevent re-saving

  const roomPlayers = Array.isArray(room.players) ? room.players : [];
  const leaderboard = [];
  const endTime = new Date();

  for (const player of roomPlayers) {
    const score = await scores.getScore(roomCode, player.id) || 0;
    leaderboard.push({
      userId: player.id,
      username: player.username,
      score,
    });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  const winner = leaderboard[0]?.userId;

  await db.saveMatch({
    roomId: roomCode,
    players: leaderboard,
    duration,
    startTime,
    endTime,
    winner,
  });

  sendToRoom(
    roomCode,
    {
      type: "END_GAME",
      payload: { leaderboard },
    },
    wss
  );

  console.log("🏁 Game over in room %s. Leaderboard:", roomCode, leaderboard);

  // Gracefully close all sockets after 3s
  setTimeout(() => {
    for (const player of roomPlayers) {
      const socket = getSocket(player.id);
      if (socket?.readyState === 1) {
        socket.close();
      }
    }
  }, 3000);
}

module.exports = endGame;
