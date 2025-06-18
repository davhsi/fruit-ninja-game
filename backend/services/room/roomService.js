// backend/services/room/roomService.js
const { generateRoomCode } = require("../../utils/roomUtils");
const rooms = require("../../websocket/rooms");

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

  rooms[roomCode] = roomData;
  return roomData;
};

exports.joinRoom = async (roomCode, userId) => {
  const room = rooms[roomCode];
  if (!room) throw new Error("Room not found");

  if (room.players.includes(userId)) return room; // already in
  if (room.players.length >= room.maxPlayers) throw new Error("Room full");
  if (room.gameStarted) throw new Error("Game already started");

  room.players.push(userId);
  return room;
};

exports.getRoom = async (roomCode) => {
  return rooms[roomCode] || null;
};

exports.startGame = async (roomCode) => {
  if (roomCode === '__proto__' || roomCode === 'constructor' || roomCode === 'prototype') {
    throw new Error("Invalid room code");
  }
  const room = rooms[roomCode];
  if (!room) throw new Error("Room not found");
  if (room.gameStarted) throw new Error("Game already started");

  room.gameStarted = true;
  return room;
};

