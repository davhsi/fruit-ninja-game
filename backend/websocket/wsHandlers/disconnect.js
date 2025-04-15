// websocket/wsHandlers/disconnect.js
const { getRoom, setRoom, deleteRoom } = require("../rooms");
const { getSocket } = require("./inMemorySockets");

async function handleDisconnect(socket, wss, activeFruitIntervals) {
  const { roomId, userId } = socket;
  if (!roomId || !userId) return;

  console.log(`⚠️ Player ${userId} disconnected from room ${roomId}`);

  const room = await getRoom(roomId);
  if (!room || !Array.isArray(room.players)) return;

  const updatedPlayers = room.players.map((player) =>
    player.id === userId ? { ...player, active: false } : player
  );

  // Save updated room state
  await setRoom(roomId, { ...room, players: updatedPlayers });

  // Notify other players
  for (const player of updatedPlayers) {
    if (player.id !== userId) {
      const targetSocket = getSocket(player.id);
      if (targetSocket && targetSocket.readyState === 1) {
        targetSocket.send(
          JSON.stringify({
            type: "player_disconnected",
            userId,
          })
        );
      }
    }
  }

  const allInactive = updatedPlayers.every((p) => !p.active);

  if (allInactive) {
    console.log(`🧹 Cleaning up room ${roomId} (empty)`);

    if (activeFruitIntervals[roomId]) {
      clearInterval(activeFruitIntervals[roomId]);
      delete activeFruitIntervals[roomId];
    }

    await deleteRoom(roomId);
  }
}

module.exports = handleDisconnect;
