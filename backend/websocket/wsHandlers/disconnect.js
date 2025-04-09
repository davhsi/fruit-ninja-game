// websocket/wsHandlers/disconnect.js
const rooms = require("../rooms");

function handleDisconnect(socket, wss) {
  const { roomId, userId } = socket;
  if (!roomId || !userId) return;

  console.log(`⚠️ Player ${userId} disconnected from room ${roomId}`);

  const roomPlayers = rooms[roomId] || [];
  const updatedPlayers = roomPlayers.map((client) => {
    if (client.id === userId) {
      return { ...client, active: false };
    }
    return client;
  });

  rooms[roomId] = updatedPlayers;

  updatedPlayers.forEach((client) => {
    if (client.socket && client.socket.readyState === 1) {
      client.socket.send(
        JSON.stringify({
          type: "player_disconnected",
          userId,
        })
      );
    }
  });
}

module.exports = handleDisconnect;