// routes/matches.js
const express = require("express");
const router = express.Router();
const db = require("../services/db/dbService");

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const matches = await db.getMatchesForUser(userId);
    res.json({ matches });
  } catch (err) {
    console.error("❌ Failed to fetch matches for user:", err);
    res.status(500).json({ error: "Failed to fetch match history" });
  }
});

module.exports = router;
