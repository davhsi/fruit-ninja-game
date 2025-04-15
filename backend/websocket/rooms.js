// websocket/rooms.js
const redis = require('../redis/redisClient');

const ROOM_PREFIX = 'room:';

const getRoomKey = (roomCode) => `${ROOM_PREFIX}${roomCode}`;

// Helper: Get room array (parsed from JSON)
const getRoom = async (roomCode) => {
  const data = await redis.get(getRoomKey(roomCode));
  return data ? JSON.parse(data) : null;
};

// Helper: Set room array
const setRoom = async (roomCode, roomData) => {
  await redis.set(getRoomKey(roomCode), JSON.stringify(roomData));
};

// Helper: Delete room
const deleteRoom = async (roomCode) => {
  await redis.del(getRoomKey(roomCode));
};

// Mark game as saved (set a flag in Redis)
const markGameSaved = async (roomCode) => {
  const key = getRoomKey(roomCode);
  const room = await getRoom(roomCode);
  if (!room) return;

  room.gameSaved = true;
  await setRoom(roomCode, room);
};

module.exports = {
  getRoomKey,
  getRoom,
  setRoom,
  deleteRoom,
  markGameSaved,
};
