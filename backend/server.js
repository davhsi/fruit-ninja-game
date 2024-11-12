const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');
const rooms = require('./websocket/rooms');
const dotenv = require('dotenv');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const { initializeWebSocket } = require('./websocket/wsHandler');
const { redisClient } = require('./redis/redisClient');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/', roomRoutes);

// Redis Connection
(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1);
    }
})();

// WebSocket Initialization
initializeWebSocket(server, wss);

// Server Listen
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Upgrade for WebSocket
server.on('upgrade', async (req, socket, head) => {
    const roomId = req.url.split('/')[1];
    const roomExists = await redisClient.exists(`room:${roomId}:size`);
    if (!roomExists) {
        socket.destroy();
        console.log(`Invalid room ID: ${roomId}`);
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, roomId);
    });
});
