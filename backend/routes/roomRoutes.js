// backend/routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const roomService = require("../services/room/roomService");

// @route POST /api/room/create
router.post("/create", async (req, res) => {
  const { userId, maxPlayers, duration } = req.body;
  try {
    if (duration > 120) return res.status(400).json({ message: "Duration max 120 seconds" });

    const room = await roomService.createRoom(userId, maxPlayers, duration);
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/room/join
router.post("/join", async (req, res) => {
  const { userId, roomCode } = req.body;
  try {
    const room = await roomService.joinRoom(roomCode, userId);
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route POST /api/room/start
router.post("/start", async (req, res) => {
    const { roomCode } = req.body;
    if (roomCode === '__proto__' || roomCode === 'constructor' || roomCode === 'prototype') {
      return res.status(400).json({ message: "Invalid room code" });
    }
  
    try {
      const room = await roomService.startGame(roomCode);
  
      // TODO: Broadcast via WS to notify clients
      res.json(room);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  

module.exports = router;
