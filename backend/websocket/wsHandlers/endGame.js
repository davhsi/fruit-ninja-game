const rooms = require("../rooms");
const db = require("../../services/db/dbService");
const scores = require("./scoreManager");
const { sendToRoom } = require("../../utils/sendToRoom");

/**
 * Ends the game, sends final leaderboard, saves match results, and closes sockets (after delay).
 *
 * @param {string} roomCode - Room ID
 * @param {number} duration - Duration of the match in seconds
 * @param {Date} startTime - When the match started
 * @param {WebSocket.Server} wss - WebSocket server instance
 */
async function endGame(roomCode, duration, startTime, wss) {
  const room = rooms[roomCode];
  if (!room) return;

  // ✅ Prevent multiple saves
  if (room._gameSaved) {
    console.log(`⚠️ Game in room ${roomCode} already saved. Skipping...`);
    return;
  }
  room._gameSaved = true;

  const roomPlayers = Array.isArray(room.players) ? room.players : [];
  const leaderboard = [];
  const endTime = new Date();

  // 🧠 Collect scores
  for (const player of roomPlayers) {
    const score = scores.getScore(roomCode, player.id) || 0;
    leaderboard.push({ userId: player.id, username: player.username, score });
  }

  // 🥇 Rank players
  leaderboard.sort((a, b) => b.score - a.score);
  const winner = leaderboard[0]?.userId;

  // 💾 Persist match results
  await db.saveMatch({
    roomId: roomCode,
    players: leaderboard,
    duration,
    startTime,
    endTime,
    winner,
  });

  // 📣 Notify frontend with final leaderboard (first!)
  sendToRoom(
    roomCode,
    {
      type: "END_GAME",
      payload: { leaderboard },
    },
    wss
  );

  console.log(`🏁 Game over in room ${roomCode}. Leaderboard:`, leaderboard);

  // ⏳ Grace period (3s) to let frontend show final leaderboard
  setTimeout(() => {
    for (const player of roomPlayers) {
      if (player.socket?.readyState === 1) {
        player.socket.close();
      }
    }
  }, 3000);
}

module.exports = endGame;
