const { sendToRoom } = require("../../utils/sendToRoom");
const { v4: uuidv4 } = require("uuid");
const emojiOptions = ["🍎", "🍌", "🍉", "🍓", "🍇", "🍍"];
const rooms = require("../rooms");
const endGame = require("./endGame"); // must accept (roomCode, duration, startTime, wss)

function handleStartGame(data, wss, ws, activeFruitIntervals) {
  const { roomCode, duration } = data;
  const room = rooms[roomCode];
  if (!room) return;

  const hostId = room.players[0]?.id;
  if (ws.userId !== hostId) return; // Only host can start

  // Clean up any old interval for this room
  if (activeFruitIntervals[roomCode]) {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];
  }

  const gameStartTime = new Date();

  sendToRoom(roomCode, {
    type: "GAME_STARTED",
    payload: { duration },
  });

  // Begin fruit drops
  activeFruitIntervals[roomCode] = setInterval(() => {
    const fruit = {
      id: uuidv4(),
      emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
      x: 5 + Math.random() * 85,
      y: 0,
      speed: 1 + Math.random() * 2,
    };

    sendToRoom(roomCode, { type: "FRUIT", payload: fruit });
  }, 1000);

  // End game after specified duration
  setTimeout(() => {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];

    if (typeof endGame === "function") {
      endGame(roomCode, duration, gameStartTime, wss); // ✅ fixed
    }
  }, duration * 1000);
}

module.exports = handleStartGame;
