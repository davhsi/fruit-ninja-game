// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../services/db/dbService");
const { signToken } = require("../utils/jwtUtils");

// ✅ Register
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Create the user with the raw password, the hashing is done by the schema
    const newUser = await db.createUser({ email, username, password });

    // Generate a token after creating the user
    const token = signToken({ id: newUser._id, email: newUser.email });

    // Respond with the user data and token
    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error("❌ Registration Error:", err); // Log the full error for debugging
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});


// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id, email: user.email });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
