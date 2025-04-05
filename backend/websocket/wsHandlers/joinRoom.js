const rooms = require("../rooms");

function handleJoinRoom(ws, data) {
  const { roomCode, userId } = data;
  ws.userId = userId;
  ws.roomId = roomCode;

  if (!rooms[roomCode]) rooms[roomCode] = [];
  if (!rooms[roomCode].includes(ws)) {
    rooms[roomCode].push(ws);
  }

  console.log(`👥 Player ${userId} joined room ${roomCode}`);
}

module.exports = handleJoinRoom;
