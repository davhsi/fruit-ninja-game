const rooms = require("../rooms");
const db = require("../../services/db/dbService");
const scores = require("./scoreManager"); // ← same thing
const { sendToRoom } = require("../../utils/sendToRoom");

/**
 * Ends the game, closes player sockets, saves match results, and notifies players.
 *
 * @param {string} roomCode - Room ID
 * @param {number} duration - Duration of the match in seconds
 * @param {Date} startTime - When the match started
 * @param {WebSocket.Server} wss - WebSocket server instance
 */
async function endGame(roomCode, duration, startTime, wss) {
  const roomPlayers = Array.isArray(rooms[roomCode]?.players) ? rooms[roomCode].players : [];
  const leaderboard = [];
  const endTime = new Date();

  // 🛑 Close player sockets
  for (const player of roomPlayers) {
    if (player.socket?.readyState === 1) {
      player.socket.close();
    }
  }

  // 🧠 Collect scores
  for (const player of roomPlayers) {
    const score = scores.getScore(roomCode, player.id) || 0;
    leaderboard.push({ userId: player.id, score });
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

  // 📣 Notify all in the room
  sendToRoom(
    roomCode,
    {
      type: "END_GAME",
      payload: { leaderboard },
    },
    wss
  );

  console.log(`🏁 Game over in room ${roomCode}. Leaderboard:`, leaderboard);
}

module.exports = endGame;
