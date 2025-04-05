// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../services/db/dbService");
const { signToken } = require("../utils/jwtUtils");

// Register
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const user = await db.createUser({ email, password, username });
    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
