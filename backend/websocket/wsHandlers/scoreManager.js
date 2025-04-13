const scores = {}; // { roomCode: { userId: score } }

function updateScore(roomCode, userId, delta) {
  if (!scores[roomCode]) scores[roomCode] = {};
  if (!scores[roomCode][userId]) scores[roomCode][userId] = 0;

  scores[roomCode][userId] += delta;

  console.log(`🧮 updateScore | room: ${roomCode}, user: ${userId}, delta: ${delta}, newScore: ${scores[roomCode][userId]}`);
}

function getScore(roomCode, userId) {
  const score = scores[roomCode]?.[userId] || 0;
  console.log(`📥 getScore | room: ${roomCode}, user: ${userId}, score: ${score}`);
  return score;
}

function resetScores(roomCode) {
  console.log(`🔁 resetScores | room: ${roomCode}`);
  delete scores[roomCode];
}

module.exports = {
  updateScore,
  getScore,
  resetScores,
};
