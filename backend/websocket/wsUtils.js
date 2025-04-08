// websocket/wsUtils.js

const WebSocket = require("ws");
const rooms = require("./rooms");

// 📡 Broadcast a message to all players in a room

function broadcastToRoom(roomCode, message, wss) {
  const roomPlayers = Array.isArray(rooms[roomCode]) ? rooms[roomCode] : [];

  roomPlayers.forEach((client) => {
    if (client.socket && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify(message));
    }
  });
}

// 🍉 Generate a random fruit or bomb
function generateRandomFruit() {
  const fruitTypes = ["apple", "banana", "orange", "bomb"];
  const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
  const x = Math.floor(Math.random() * 500); // Random X position
  const y = 0; // Start from the top

  return { type, x, y };
}

module.exports = {
  broadcastToRoom,
  generateRandomFruit,
};
