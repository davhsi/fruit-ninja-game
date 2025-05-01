// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const job = require('./cron');

dotenv.config();
console.log("🧪 JWT_SECRET:", process.env.JWT_SECRET);

const setupWebSocket = require("./websocket/setupWebSocket");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const matches = require("./routes/matches");

const dbService = require("./services/db/dbService"); // ✅ Import DB service


const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://fruitninja.davish.me",
    "https://fruitninja-api.davish.me"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/matches", matches);

// ✅ Create HTTP server for Express + WebSocket
const server = http.createServer(app);

// ✅ Setup WebSocket
setupWebSocket(server);

// ✅ Initialize DB and then start server
const PORT = process.env.PORT || 3001;
dbService.init()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server and WebSocket running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1); // Kill the app if DB fails
  });
