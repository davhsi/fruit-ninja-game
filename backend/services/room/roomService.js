// backend/services/room/roomService.js
const redis = require("../../redis/redisClient");
const { generateRoomCode } = require("../../utils/roomUtils");

const ROOM_PREFIX = "room:";

exports.createRoom = async (hostId, maxPlayers, duration) => {
  const roomCode = generateRoomCode();
  const roomData = {
    roomCode,
    hostId,
    players: [hostId],
    maxPlayers,
    duration,
    gameStarted: false
  };

  await redis.set(ROOM_PREFIX + roomCode, JSON.stringify(roomData));
  return roomData;
};

exports.joinRoom = async (roomCode, userId) => {
  const roomKey = ROOM_PREFIX + roomCode;
  const data = await redis.get(roomKey);
  if (!data) throw new Error("Room not found");

  const room = JSON.parse(data);
  if (room.players.includes(userId)) return room; // already in
  if (room.players.length >= room.maxPlayers) throw new Error("Room full");
  if (room.gameStarted) throw new Error("Game already started");

  room.players.push(userId);
  await redis.set(roomKey, JSON.stringify(room));
  return room;
};

exports.getRoom = async (roomCode) => {
  const data = await redis.get(ROOM_PREFIX + roomCode);
  if (!data) return null;
  return JSON.parse(data);
};

exports.startGame = async (roomCode) => {
    const key = ROOM_PREFIX + roomCode;
    const data = await redis.get(key);
    if (!data) throw new Error("Room not found");
  
    const room = JSON.parse(data);
    if (room.gameStarted) throw new Error("Game already started");
  
    room.gameStarted = true;
    await redis.set(key, JSON.stringify(room));
    return room;
  };
  