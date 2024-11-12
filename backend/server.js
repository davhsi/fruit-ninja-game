const express = require('express');
const WebSocket = require('ws');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1);
    }
})();

app.use(express.json());
app.use(require('cors')());

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

// Store active WebSocket connections by room
const rooms = {};

// WebSocket connection handler
wss.on('connection', (ws, roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(ws);

    console.log(`New connection in room ${roomId}. Total clients: ${rooms[roomId].length}`);

    ws.on('message', async (message) => {
        try {
            const parsed = JSON.parse(message);

            // Handle the "START_GAME" event
            if (parsed.type === 'START_GAME') {
                console.log(`Game started in room ${roomId}`);
                broadcastToRoom(roomId, { type: 'START_GAME' });

                // End the game after 60 seconds
                setTimeout(async () => {
                    const scores = await getRoomScores(roomId);
                    broadcastToRoom(roomId, { type: 'GAME_OVER', scores });

                    // Cleanup room resources after the game ends
                    await redisClient.del(`room:${roomId}:users`);
                    await redisClient.del(`room:${roomId}:size`);
                    delete rooms[roomId];
                    console.log(`Game ended in room ${roomId}. Resources cleaned.`);
                }, 60000); // 60 seconds
            }

            // Handle the "CLICK" event
            if (parsed.type === 'CLICK') {
                await redisClient.incr(`room:${roomId}:user:${parsed.userId}`);
                const scores = await getRoomScores(roomId);
                broadcastToRoom(roomId, { type: 'UPDATE_SCORES', scores });
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        rooms[roomId] = rooms[roomId].filter((client) => client !== ws);
        console.log(`Client disconnected from room ${roomId}. Total clients: ${rooms[roomId].length}`);
        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} closed as no clients are left.`);
        }
    });
});

// Utility function to broadcast messages to all clients in a room
function broadcastToRoom(roomId, message) {
    if (rooms[roomId]) {
        rooms[roomId].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

// Utility to fetch scores for a room
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

// API to create a new room
app.post('/create-room', async (req, res) => {
    try {
        const { size, userId } = req.body;

        if (!userId) return res.status(400).send('User ID is required.');

        const roomId = uuidv4().slice(0, 4); // Generate a 4-digit room ID
        await redisClient.set(`room:${roomId}:size`, size);
        await redisClient.sAdd(`room:${roomId}:users`, userId); // Add creator to the room
        res.json({ roomId });
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).send('Error creating room');
    }
});


// API to join a room
app.post('/join-room', async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const size = await redisClient.get(`room:${roomId}:size`);

        if (!size) return res.status(404).send('Room not found.');

        const currentUsers = await redisClient.sCard(`room:${roomId}:users`);
        if (currentUsers >= size) return res.status(400).send('Room is full.');

        await redisClient.sAdd(`room:${roomId}:users`, userId);
        res.status(200).send('Joined');
    } catch (err) {
        console.error('Error joining room:', err);
        res.status(500).send('Error joining room');
    }
});

// WebSocket upgrade handler
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('upgrade', async (req, socket, head) => {
    const roomId = req.url.split('/')[1];

    // Validate room exists in Redis
    const roomExists = await redisClient.exists(`room:${roomId}:size`);
    if (!roomExists) {
        socket.destroy();
        console.log(`Attempted connection to invalid room ${roomId}`);
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, roomId);
    });
});
