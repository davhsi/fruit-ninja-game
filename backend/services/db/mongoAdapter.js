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
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format");
  }
  return await User.findOne({ email: { $eq: email } }).lean();
}

async function createUser(userData) {
  return await User.create(userData);
}

async function getMatchHistoryByUser(userId) {
  const matches = await Match.find({ "players.userId": userId })
    .sort({ startTime: -1 })
    .lean();

  // collect all unique userIds across all matches
  const allUserIds = [
    ...new Set(matches.flatMap((match) => match.players.map((p) => p.userId))),
  ];

  const users = await User.find({ _id: { $in: allUserIds } }, "_id username").lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.username]));

  // enrich players and normalize some fields for frontend compatibility
  return matches.map((match) => ({
    ...match,
    players: match.players.map((p) => ({
      ...p,
      username: userMap[p.userId] || "Anonymous",
    })),
    roomCode: match.roomId, // for frontend
    endedAt: match.endTime, // for frontend
  }));
}



module.exports = {
  connect,
  saveMatch,
  getMatches,
  getMatchHistoryByUser,
  getUserByEmail,
  createUser,
};
