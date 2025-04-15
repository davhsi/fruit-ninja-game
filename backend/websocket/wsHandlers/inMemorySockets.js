const socketMap = new Map(); // Map<roomCode, Map<userId, ws>>

function addSocket(roomCode, userId, ws) {
  if (!socketMap.has(roomCode)) {
    socketMap.set(roomCode, new Map());
  }
  socketMap.get(roomCode).set(userId, ws);
}

function getSocket(roomCode, userId) {
  return socketMap.get(roomCode)?.get(userId);
}

function getSocketsInRoom(roomCode) {
  return socketMap.get(roomCode) || new Map();
}

function removeSocket(roomCode, userId) {
  const room = socketMap.get(roomCode);
  if (room) {
    room.delete(userId);
    if (room.size === 0) socketMap.delete(roomCode);
  }
}

module.exports = {
  addSocket,
  getSocket,
  getSocketsInRoom,
  removeSocket,
};
