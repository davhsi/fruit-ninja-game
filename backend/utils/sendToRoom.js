// websocket/sendToRoom.js
const { getSocketsInRoom } = require("../websocket/wsHandlers/inMemorySockets");
const redis = require("../redis/redisClient");

async function sendToRoom(roomCode, message) {
  // Get socket instances (live WebSocket clients)
  const socketMap = getSocketsInRoom(roomCode);

  if (!socketMap || socketMap.size === 0) {
    console.warn(`❗ sendToRoom | No sockets in room ${roomCode}`);
    return;
  }

  // Optional: Pull latest player list from Redis just for logging/debug
  try {
    const redisRoom = await redis.hgetall(`room:${roomCode}`);
    const players = JSON.parse(redisRoom.players || "[]");
    console.log(`📤 Broadcasting to room ${roomCode} | Players:`, players.map(p => p.username));
  } catch (e) {
    console.error(`❌ Failed to fetch Redis room data for ${roomCode}:`, e.message);
  }

  for (const [userId, socket] of socketMap.entries()) {
    if (socket.readyState === 1) {
      console.log(`📤 sendToRoom(${roomCode}) → userId: ${userId}`, message);
      socket.send(JSON.stringify(message));
    }
  }
}

module.exports = { sendToRoom };
