// wsHandlers/scoreManager.js (acts like a score manager)
const scores = {}; // { roomCode: { userId: score } }

function updateScore(roomCode, userId, delta) {
  if (!scores[roomCode]) scores[roomCode] = {};
  if (!scores[roomCode][userId]) scores[roomCode][userId] = 0;

  scores[roomCode][userId] += delta;
}

function getScore(roomCode, userId) {
  return scores[roomCode]?.[userId] || 0;
}

function resetScores(roomCode) {
  delete scores[roomCode];
}

module.exports = {
  updateScore,
  getScore,
  resetScores,
};
