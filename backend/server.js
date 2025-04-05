// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const setupWebSocket = require("./websocket/setupWebSocket"); // ✅ updated path

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);

// ✅ Create HTTP server to use with both Express & WebSocket
const server = http.createServer(app);

// ✅ Setup WebSocket server
setupWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server and WebSocket running on port ${PORT}`);
});
