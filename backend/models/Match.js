const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  roomId: String,
  players: [
    {
      userId: String,
      score: Number,
    }
  ],
  startTime: Date,
  endTime: Date,
  duration: Number,
  winner: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Match", matchSchema);
