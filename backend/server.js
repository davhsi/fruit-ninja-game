const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');
const rooms = require('./websocket/rooms');
const dotenv = require('dotenv');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const { initializeWebSocket } = require('./websocket/wsHandler');
const { redisClient } = require('./redis/redisClient');
const job = require('./cron')
job.start();

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Middleware for CORS with options
app.use(cors({
    origin: 'https://fruitninjahsi.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    credentials: true, // Allow credentials like cookies or tokens
}));

// Middleware for JSON parsing
app.use(express.json());

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

// Upgrade for WebSocket with CORS handling
server.on('upgrade', async (req, socket, head) => {
    // Optionally set CORS headers for WebSocket upgrade if needed
    const origin = req.headers.origin;
    if (origin !== 'https://fruitninjahsi.vercel.app') { // Replace with frontend origin
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }

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
