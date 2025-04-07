const rooms = require("../websocket/rooms");

function sendToRoom(roomCode, message) {
  if (!rooms[roomCode]) return;

  rooms[roomCode].players.forEach((player) => {
    const client = player.ws;
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = { sendToRoom };
