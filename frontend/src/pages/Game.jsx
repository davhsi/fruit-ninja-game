import React from "react";
import { useGame } from "@/hooks/useGame";
import LeaderboardPanel from "@/components/LeaderboardPanel";

const Game = () => {
  const {
    gameStarted,
    timeLeft,
    score,
    fruits,
    leaderboard,
    handleSlice,
  } = useGame({ roomCode, user, gameDuration: 30 });

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <h2 className="absolute top-4 left-4 text-lg font-bold">
          Time: {timeLeft}s
        </h2>
        <h2 className="absolute top-4 right-4 text-lg font-bold">
          Score: {score}
        </h2>

        {gameStarted ? (
          <div className="w-full h-full relative">
            {fruits.map((fruit) => (
              <div
                key={fruit.id}
                onClick={() => handleSlice(fruit.id)}
                className="absolute text-4xl cursor-pointer select-none transition-transform"
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
          <div className="text-xl text-gray-700 font-semibold">
            Waiting for host to start the game...
          </div>
        )}
      </div>

      {/* Live Leaderboard */}
      <LeaderboardPanel leaderboard={leaderboard} />
    </div>
  );
};

export default Game;
