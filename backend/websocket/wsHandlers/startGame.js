const { broadcastToRoom, generateRandomFruit } = require("../wsUtils");
const broadcastLeaderboard = require("./leaderboard");
const endGame = require("./endGame");

function handleStartGame(data, wss) {
  const { roomCode, duration } = data;
  const startTime = new Date(); // 🕒 Record when game starts

  console.log(`🚀 Game started for room ${roomCode}, duration: ${duration}s`);

  const fruitInterval = setInterval(() => {
    const fruit = generateRandomFruit();
    broadcastToRoom(roomCode, { type: "FRUIT", payload: fruit }, wss);
    broadcastLeaderboard(roomCode, wss);
  }, 1000);

  setTimeout(() => {
    clearInterval(fruitInterval);
    endGame(roomCode, duration, startTime, wss); // ✅ Pass startTime here
  }, duration * 1000);
}

module.exports = handleStartGame;
