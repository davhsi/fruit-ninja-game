// websocket/wsHandlers/disconnect.js
const redisClient = require("../../redis/redisClient");
const rooms = require("../rooms");

function handleDisconnect(socket, wss) {
  const { roomId, userId } = socket;
  if (!roomId || !userId) return;

  console.log(`⚠️ Player ${userId} disconnected from room ${roomId}`);

  redisClient.hget(`room:${roomId}:players`, userId, (err, playerData) => {
    if (playerData) {
      const player = JSON.parse(playerData);
      player.active = false;

      redisClient.hset(`room:${roomId}:players`, userId, JSON.stringify(player));

      // Broadcast disconnection to room
      const roomPlayers = rooms[roomId] || [];
      roomPlayers.forEach((client) => {
        if (client.readyState === 1 && client.roomId === roomId) {
          client.send(
            JSON.stringify({
              type: "player_disconnected",
              userId,
            })
          );
        }
      });
    }
  });
}

module.exports = handleDisconnect;
