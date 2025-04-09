const { generateRandomFruit } = require("../wsUtils");
const broadcastLeaderboard = require("./leaderboard");
const endGame = require("./endGame");
const rooms = require("../rooms");
const { sendToRoom } = require("../../utils/sendToRoom");

function handleStartGame(data, wss, ws) {
  const { roomCode, duration } = data;

  if (!ws || !ws.userId || !ws.roomCode) {
    console.error("❌ START_GAME: Missing ws context");
    return;
  }

  // Check if room exists
  const room = rooms[roomCode];
  if (!room) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Room does not exist" }));
    return;
  }

  const hostId = room.players[0]?.id;
  if (ws.userId !== hostId) {
    ws.send(
      JSON.stringify({ type: "ERROR", message: "Only host can start the game" })
    );
    console.warn(`🚫 Non-host tried to start game: ${ws.userId}`);
    return;
  }

  const startTime = new Date();
  console.log(`🚀 Game started for room ${roomCode}, duration: ${duration}s`);

  sendToRoom(roomCode, { type: "GAME_STARTED", payload: { duration } }, wss);

  const fruitInterval = setInterval(() => {
    const fruit = generateRandomFruit();
    sendToRoom(roomCode, { type: "FRUIT", payload: fruit });
    broadcastLeaderboard(roomCode, wss);
  }, 1000);

  setTimeout(() => {
    clearInterval(fruitInterval);
    endGame(roomCode, duration, startTime, wss);
  }, duration * 1000);
}

module.exports = handleStartGame;
