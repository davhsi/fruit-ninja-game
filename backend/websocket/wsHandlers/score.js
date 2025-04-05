// wsHandlers/score.js
const redisClient = require("../../redis/redisClient");

async function updateScore(roomCode, userId, scoreDelta) {
  const key = `score:${roomCode}:${userId}`;
  await redisClient.incrby(key, scoreDelta);
  console.log(`🧮 Score updated for ${userId} in room ${roomCode}: ${scoreDelta}`);
}

module.exports = updateScore;
