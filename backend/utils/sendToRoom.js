// utils/sendToRoom.js
let wssInstance = null;

function initSendToRoom(wss) {
  wssInstance = wss;
}

function sendToRoom(roomCode, message) {
  const rooms = require("../websocket/rooms");
  if (!rooms[roomCode]) return;

  wssInstance.clients.forEach((client) => {
    if (
      client.readyState === 1 && // OPEN
      client.roomCode === roomCode
    ) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = { initSendToRoom, sendToRoom };
