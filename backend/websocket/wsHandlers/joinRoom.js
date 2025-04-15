require("dotenv").config();
const jwt = require("jsonwebtoken");
const { sendToRoom } = require("../../utils/sendToRoom");

const { getRoom, setRoom } = require("../rooms");
const { addSocket, getSocketsInRoom } = require("./inMemorySockets");

async function handleJoinRoom(ws, data, wss) {
  console.log("🔥 handleJoinRoom called");

  const { token, roomCode } = data;

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = user.id;
    const username = user.username;

    console.log("✅ Token verified:", username);

    // Get or initialize room
    const room = (await getRoom(roomCode)) || { players: [], scores: {} };

    // Close duplicate sockets
    getSocketsInRoom(roomCode).forEach((client, existingUserId) => {
      if (
        client !== ws &&
        client.readyState === 1 &&
        existingUserId === userId
      ) {
        console.log("🛑 Closing duplicate socket for", username);
        client.close();
      }
    });

    // Tag current socket
    ws.roomCode = roomCode;
    ws.userId = userId;

    // Add socket to in-memory map
    addSocket(roomCode, userId, ws);

    // Check if player already exists
    const existingPlayer = room.players.find(p => p.id === userId);

    if (!existingPlayer) {
      room.players.push({ id: userId, username });
      room.scores[userId] = 0;
      console.log("👥 Added new player:", username);
    } else {
      console.log("🔁 Reconnected player:", username);
    }

    // Save updated room to Redis
    await setRoom(roomCode, room);

    // Get host
    const hostId = room.players[0]?.id;

    // Broadcast player list
    sendToRoom(roomCode, {
      type: "PLAYER_LIST",
      payload: {
        hostId,
        players: room.players.map(p => ({
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
