const { sendToRoom } = require("../../utils/sendToRoom");
const { v4: uuidv4 } = require("uuid");
const emojiOptions = ["🍎", "🍌", "🍉", "🍓", "🍇", "🍍"];

const { getRoom } = require("../rooms");
const { getSocket } = require("./inMemorySockets");
const endGame = require("./endGame");

async function handleStartGame(data, wss, ws, activeFruitIntervals) {
  const { roomCode, duration } = data;

  const room = await getRoom(roomCode);
  if (!room) return;

  const hostId = room.players[0]?.id;
  if (ws.userId !== hostId) {
    console.log("⛔ Not the host, cannot start game");
    return;
  }

  // Cleanup any previous interval
  if (activeFruitIntervals[roomCode]) {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];
  }

  const gameStartTime = new Date();

  sendToRoom(roomCode, {
    type: "GAME_STARTED",
    payload: {
      duration,
      roomCode,
    },
  });

  // Start fruit dropper
  activeFruitIntervals[roomCode] = setInterval(() => {
    const fruit = {
      id: uuidv4(),
      emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
      x: 5 + Math.random() * 85,
      y: 0,
      speed: 1 + Math.random() * 2,
    };

    sendToRoom(roomCode, {
      type: "FRUIT",
      payload: {
        ...fruit,
        roomCode,
      },
    });
  }, 1000);

  // End game after timeout
  setTimeout(() => {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];

    if (typeof endGame === "function") {
      endGame(roomCode, duration, gameStartTime, wss);
    }
  }, duration * 1000);
}

module.exports = handleStartGame;
