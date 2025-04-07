require("dotenv").config();
const rooms = require("../rooms");
const jwt = require("jsonwebtoken");
const { sendToRoom } = require("../../utils/sendToRoom");

console.log("🧪 handleJoinRoom: JWT_SECRET =", process.env.JWT_SECRET);

function handleJoinRoom(ws, data, wss) {
  console.log("🔥 handleJoinRoom called");
  const { token, roomCode } = data;

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = user.id;
    const username = user.email; // ✅ FIXED

    console.log("✅ Token verified:", username);

    if (!rooms[roomCode]) {
      console.log("🆕 Creating new room:", roomCode);
      rooms[roomCode] = {
        players: [],
        scores: {},
      };
    }

    // Close duplicate sockets
    wss.clients.forEach((client) => {
      if (
        client !== ws &&
        client.readyState === 1 &&
        client.userId === userId &&
        client.roomCode === roomCode
      ) {
        console.log("🛑 Closing duplicate socket for", username);
        client.close();
      }
    });

    // Tag socket
    ws.roomCode = roomCode;
    ws.userId = userId;

    // Add player if not already in room
    const playerAlreadyInRoom = rooms[roomCode].players.find(p => p.id === userId);
    if (!playerAlreadyInRoom) {
      rooms[roomCode].players.push({ id: userId, username, ws });
      rooms[roomCode].scores[userId] = 0;
    }

    console.log("👥 Current players in room", roomCode, rooms[roomCode].players);

    // Broadcast updated players
    sendToRoom(roomCode, {
      type: "PLAYER_LIST",
      payload: rooms[roomCode].players.map(p => ({ id: p.id, username: p.username })),
    });

    // Notify about new player
    sendToRoom(roomCode, {
      type: "PLAYER_JOINED",
      payload: { id: userId, username },
    });

  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid token" }));
  }
}

module.exports = handleJoinRoom;
