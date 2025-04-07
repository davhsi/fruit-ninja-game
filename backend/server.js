// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
dotenv.config();
console.log("🧪 JWT_SECRET:", process.env.JWT_SECRET);

const setupWebSocket = require("./websocket/setupWebSocket");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const matchRoutes = require("./routes/matchRoutes");

const dbService = require("./services/db/dbService"); // ✅ Import DB service


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/matches", matchRoutes);

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
