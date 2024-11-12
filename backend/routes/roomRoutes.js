const express = require('express');
const { createRoom, joinRoom } = require('../utils/roomUtils');

const router = express.Router();

// Create a room
router.post('/create-room', createRoom);

// Join a room
router.post('/join-room', joinRoom);

module.exports = router;
