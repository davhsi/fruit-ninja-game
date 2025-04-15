import React, { useMemo, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useGame from "@/hooks/useGame";
import LeaderboardPanel from "@/components/LeaderboardPanel";

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🧠 Get roomCode + user
  const roomCode = useMemo(() => {
    return location.state?.roomCode || localStorage.getItem("finalRoomCode");
  }, [location.state]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !user) {
      navigate("/");
    }
  }, [roomCode, user, navigate]);

  const gameAreaRef = useRef(null);

  const {
    gameStarted,
    timeLeft,
    score,
    fruits,
    leaderboard,
    handleSlice,
  } = useGame({ roomCode, user });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* 🎮 Game Area */}
      <div
        ref={gameAreaRef}
        className="relative flex-1 w-full h-[70vh] md:h-screen overflow-hidden flex items-center justify-center"
      >
        {/* ⏱️ UI */}
        <div className="absolute top-4 left-4 text-sm md:text-lg font-bold">
          Time: {timeLeft}s
        </div>
        <div className="absolute top-4 right-4 text-sm md:text-lg font-bold">
          Score: {score}
        </div>

        {/* 👾 Fruits */}
        {gameStarted ? (
          <div className="w-full h-full relative">
            {fruits.length === 0 && (
              <div className="text-red-500 font-bold absolute top-1/2 left-1/2 -translate-x-1/2">
                🧨 No fruits to render!
              </div>
            )}

            {fruits.map((fruit) => (
              <div
                key={fruit.id}
                onClick={() => handleSlice(fruit.id)}
                className="absolute text-3xl md:text-5xl cursor-pointer select-none"
                style={{
                  left: `${fruit.x}%`,
                  top: `${fruit.y}%`,
                  transition: "top 0.05s linear",
                }}
              >
                {fruit.emoji}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-lg text-gray-700 font-semibold text-center">
            Waiting for host to start the game...
          </div>
        )}
      </div>

      {/* 📊 Leaderboard */}
      <div className="w-full md:w-80 p-4">
        <LeaderboardPanel scores={leaderboard} highlightUserId={user?._id} />
      </div>
    </div>
  );
};

export default Game;
