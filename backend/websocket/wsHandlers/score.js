// scores.js
const scores = {}; // { [roomCode]: { [userId]: score } }

function initRoomScores(roomCode) {
  scores[roomCode] = {};
}

function updateScore(roomCode, userId, delta) {
  if (!scores[roomCode]) scores[roomCode] = {};
  scores[roomCode][userId] = (scores[roomCode][userId] || 0) + delta;
}

function getScore(roomCode, userId) {
  return scores[roomCode]?.[userId] || 0;
}

function getAllScores(roomCode) {
  return scores[roomCode] || {};
}

function clearScores(roomCode) {
  delete scores[roomCode];
}

module.exports = {
  initRoomScores,
  updateScore,
  getScore,
  getAllScores,
  clearScores,
};
