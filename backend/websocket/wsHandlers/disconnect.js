const rooms = require("../rooms");

function handleDisconnect(socket, wss, activeFruitIntervals) {
  const { roomId, userId } = socket;
  if (!roomId || !userId) return;

  console.log(`⚠️ Player ${userId} disconnected from room ${roomId}`);

  const roomPlayers = rooms[roomId] || [];

  // Mark player as inactive
  const updatedPlayers = roomPlayers.map((client) =>
    client.id === userId ? { ...client, active: false } : client
  );

  rooms[roomId] = updatedPlayers;

  // Notify remaining clients
  updatedPlayers.forEach((client) => {
    if (client.socket && client.socket.readyState === 1) {
      client.socket.send(
        JSON.stringify({
          type: "player_disconnected",
          userId,
        })
      );
    }
  });

  // Check if room is now fully empty (all inactive or gone)
  const allInactive = updatedPlayers.every((p) => !p.active);

  if (allInactive) {
    console.log(`🧹 Cleaning up room ${roomId} (empty)`);

    // Clear fruit drop interval if running
    if (activeFruitIntervals[roomId]) {
      clearInterval(activeFruitIntervals[roomId]);
      delete activeFruitIntervals[roomId];
    }

    // Remove room entirely
    delete rooms[roomId];
  }
}

module.exports = handleDisconnect;
