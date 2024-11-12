const WebSocket = require('ws');
const { broadcastToRoom, getRoomScores, cleanupRoom } = require('./wsUtils');
const { redisClient } = require('../redis/redisClient');
const rooms = require('./rooms');

// Main function to initialize WebSocket and handle events
function initializeWebSocket(server, wss) {
    wss.on('connection', (ws, roomId) => {
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push(ws);

        console.log(`New connection in room ${roomId}. Total: ${rooms[roomId].length}`);

        ws.on('message', async (message) => {
            const parsed = JSON.parse(message);
            if (parsed.type === 'START_GAME') {
                handleStartGame(roomId);
            } else if (parsed.type === 'SLICE') {
                handleSliceEvent(roomId, parsed.userId);
            }
        });

        ws.on('close', () => {
            rooms[roomId] = rooms[roomId].filter((client) => client !== ws);
            if (rooms[roomId].length === 0) cleanupRoom(roomId, rooms);
        });
    });
}

// Start the game with a 60-second countdown and broadcast the timer updates
async function handleStartGame(roomId) {
    broadcastToRoom(roomId, { type: 'START_GAME' });

    let timer = 60; // 60-second game duration
    const countdownInterval = setInterval(async () => {
        timer--;
        broadcastToRoom(roomId, { type: 'TIMER_UPDATE', timer });

        if (timer <= 0) {
            clearInterval(countdownInterval);
            const scores = await getRoomScores(roomId);
            broadcastToRoom(roomId, { type: 'GAME_OVER', scores });
            await cleanupRoom(roomId, rooms);
        }
    }, 1000);
}

// Handle "SLICE" events and update scores in Redis
async function handleSliceEvent(roomId, userId) {
    await redisClient.incr(`room:${roomId}:user:${userId}`);
    const scores = await getRoomScores(roomId);
    broadcastToRoom(roomId, { type: 'UPDATE_SCORES', scores });
}

module.exports = { initializeWebSocket };
