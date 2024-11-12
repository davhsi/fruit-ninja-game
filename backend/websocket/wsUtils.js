const WebSocket = require('ws');
const { redisClient } = require('../redis/redisClient');
const rooms = require('./rooms');

// Broadcast a message to all clients in a specific room
function broadcastToRoom(roomId, message) {
    if (rooms[roomId]) {
        rooms[roomId].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

// Retrieve the scores for all users in a room from Redis
async function getRoomScores(roomId) {
    const keys = await redisClient.keys(`room:${roomId}:user:*`);
    const scores = {};

    for (const key of keys) {
        const userId = key.split(':')[3];
        const score = await redisClient.get(key);
        scores[userId] = parseInt(score, 10) || 0;
    }

    return scores;
}

// Cleanup room data in Redis and remove it from in-memory storage
async function cleanupRoom(roomId, rooms) {
    await redisClient.del(`room:${roomId}:users`);
    await redisClient.del(`room:${roomId}:size`);
    await redisClient.del(`room:${roomId}:user:*`);
    delete rooms[roomId];
    console.log(`Room ${roomId} resources cleaned up.`);
}

module.exports = { broadcastToRoom, getRoomScores, cleanupRoom };
