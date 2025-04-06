// backend/routes/matchRoutes.js
const express = require("express");
const router = express.Router();
const { verifyTokenMiddleware } = require("../utils/jwtUtils");
const Match = require("../models/Match");

// GET /api/matches/history - Get match history for logged-in user
router.get("/history", verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const matches = await Match.find({ "players.userId": userId })
      .sort({ endTime: -1 })
      .limit(50); // You can paginate this later

    res.json({ matches });
  } catch (err) {
    console.error("Error fetching match history:", err);
    res.status(500).json({ error: "Failed to fetch match history" });
  }
});

module.exports = router;
