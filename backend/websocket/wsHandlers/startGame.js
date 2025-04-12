const { sendToRoom } = require("../../utils/sendToRoom");
const { v4: uuidv4 } = require("uuid");
const emojiOptions = ["🍎", "🍌", "🍉", "🍓", "🍇", "🍍"];
const rooms = require("../rooms");
const endGame = require("./endGame");

function handleStartGame(data, wss, ws, activeFruitIntervals) {
  const { roomCode, duration } = data;
  const room = rooms[roomCode];
  if (!room) return;

  const hostId = room.players[0]?.id;
  if (ws.userId !== hostId) return;

  if (activeFruitIntervals[roomCode]) {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];
  }

  const gameStartTime = new Date();

  // ✅ Include roomCode in GAME_STARTED
  sendToRoom(roomCode, {
    type: "GAME_STARTED",
    payload: {
      duration,
      roomCode,
    },
  });

  // ✅ Start dropping fruits, attach roomCode to each one
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
        roomCode, // ✅ new addition
      },
    });
  }, 1000);

  setTimeout(() => {
    clearInterval(activeFruitIntervals[roomCode]);
    delete activeFruitIntervals[roomCode];

    if (typeof endGame === "function") {
      endGame(roomCode, duration, gameStartTime, wss);
    }
  }, duration * 1000);
}

module.exports = handleStartGame;
