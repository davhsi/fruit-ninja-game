const { redisClient } = require('../redis/redisClient');
const { v4: uuidv4 } = require('uuid');

// Create a room with a unique ID and add the user to the room
async function createRoom(req, res) {
    try {
        const { size, userId } = req.body;
        if (!userId) return res.status(400).send('User ID is required.');

        const roomId = uuidv4().slice(0, 4);
        await redisClient.set(`room:${roomId}:size`, size);
        await redisClient.sAdd(`room:${roomId}:users`, userId);
        await redisClient.set(`room:${roomId}:user:${userId}`, 0); // Initialize score
        res.json({ roomId });
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).send('Error creating room');
    }
}

// Join an existing room and add the user to it
async function joinRoom(req, res) {
    try {
        const { roomId, userId } = req.body;
        const size = await redisClient.get(`room:${roomId}:size`);

        if (!size) return res.status(404).send('Room not found.');

        const currentUsers = await redisClient.sCard(`room:${roomId}:users`);
        if (currentUsers >= size) return res.status(400).send('Room is full.');

        await redisClient.sAdd(`room:${roomId}:users`, userId);
        await redisClient.set(`room:${roomId}:user:${userId}`, 0); // Initialize score
        res.status(200).send('Joined');
    } catch (err) {
        console.error('Error joining room:', err);
        res.status(500).send('Error joining room');
    }
}

module.exports = { createRoom, joinRoom };
