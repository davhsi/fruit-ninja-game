const redis = require('../../redis/redisClient');

const SCORE_PREFIX = 'score:';

const getScoreKey = (roomCode) => `${SCORE_PREFIX}${roomCode}`;

// Increment a user's score in Redis
async function updateScore(roomCode, userId, delta) {
  const key = getScoreKey(roomCode);
  await redis.hincrby(key, userId, delta);

  const newScore = await redis.hget(key, userId);
  console.log(`🧮 updateScore | room: ${roomCode}, user: ${userId}, delta: ${delta}, newScore: ${newScore}`);
}

// Fetch a user's score from Redis
async function getScore(roomCode, userId) {
  const key = getScoreKey(roomCode);
  const raw = await redis.hget(key, userId);
  const score = parseInt(raw || '0', 10);

  console.log(`📥 getScore | room: ${roomCode}, user: ${userId}, score: ${score}`);
  return score;
}

// Delete all scores for a room
async function resetScores(roomCode) {
  const key = getScoreKey(roomCode);
  await redis.del(key);
  console.log(`🔁 resetScores | room: ${roomCode}`);
}

module.exports = {
  updateScore,
  getScore,
  resetScores,
};
