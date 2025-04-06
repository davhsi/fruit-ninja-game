// services/db/mongoAdapter.js
const mongoose = require("mongoose");
const Match = require("../../models/Match");
const User = require("../../models/User");


const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fruit-ninja";

async function connect() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

async function saveMatch(data) {
  return await Match.create(data);
}

async function getMatches() {
  return await Match.find().sort({ startTime: -1 }).lean();
}

async function getUserByEmail(email) {
  return await User.findOne({ email }).lean();
}

async function createUser(userData) {
  return await User.create(userData);
}

module.exports = {
  connect,
  saveMatch,
  getMatches,
  getUserByEmail,
  createUser,
};
