require("dotenv").config();
console.log("🧪 JWT_SECRET in JoinRooms.js:", process.env.JWT_SECRET);

const rooms = require("../rooms");
const jwt = require("jsonwebtoken");
const { sendToRoom } = require("../../utils/sendToRoom");

function handleJoinRoom(ws, data, wss) {
  console.log("🔥 handleJoinRoom called");

  const { token, roomCode } = data;


  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = user.id;
    const username = user.username;

    console.log("✅ Token verified:", username);

    // Create room if doesn't exist
    if (!rooms[roomCode]) {
      console.log("🆕 Creating new room:", roomCode);
      rooms[roomCode] = {
        players: [],
        scores: {},
      };
    }

    // Close duplicate sockets for the same user in this room
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

    // Tag the current socket with room info
    ws.roomCode = roomCode;
    ws.userId = userId;

    // Check if user already in room
    const existingPlayer = rooms[roomCode].players.find(p => p.id === userId);

    if (!existingPlayer) {
      // Add player to room
      rooms[roomCode].players.push({
        id: userId,
        username,
        ws,
      });

      // Initialize score if not present
      rooms[roomCode].scores[userId] = 0;

      console.log("👥 Added new player:", username);
    } else {
      // Update ws in case it's a reconnect
      existingPlayer.ws = ws;
      console.log("🔁 Reconnected player:", username);
    }

    // Log current players
    console.log("👥 Players in room", roomCode, rooms[roomCode].players.map(p => p.username));
    const hostId = rooms[roomCode].players[0]?.id;

    // Send updated player list to everyone
    sendToRoom(roomCode, {
      type: "PLAYER_LIST",
      payload: {
        hostId,
        players: rooms[roomCode].players.map(p => ({
          id: p.id,
          username: p.username,
        })),
      },
    });

  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid token" }));
  }
}

module.exports = handleJoinRoom;
