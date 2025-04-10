import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  connectSocket,
  sendMessage,
  onMessage,
  disconnectSocket,
} from "@/services/socket";
import LeaderboardPanel from "@/components/LeaderboardPanel";

const Game = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameDuration, setGameDuration] = useState(60);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const userId = user?.id;

  useEffect(() => {
    if (!user) return navigate("/login");

    connectSocket(token, roomCode);

    const handleMessage = (data) => {
      try {
        console.log("[Game] 📩 Received:", data);

        switch (data.type) {
          case "GAME_STARTED":
            setGameStarted(true);
            setGameDuration(data.payload.duration || 60);
            setTimeLeft(data.payload.duration || 60);
            break;

          case "FRUIT":
            if (data.payload?.id && data.payload?.emoji !== undefined) {
              setFruits((prev) => [...prev, data.payload]);
            } else {
              console.warn("[Game] ❌ Invalid FRUIT payload:", data.payload);
            }
            break;

          case "LEADERBOARD_UPDATE":
            setLeaderboard(data.payload);
            break;

          case "END_GAME":
            navigate(`/leaderboard/${roomCode}`);
            break;

          default:
            console.log("[Game] ❓ Unhandled message type:", data.type);
        }
      } catch (err) {
        console.error("🚨 Game message handler error:", err);
      }
    };

    const cleanup = onMessage(handleMessage);

    return () => {
      if (window?.socket?.off) {
        window.socket.off("message", handleMessage);
      }
      cleanup?.(); // if your socket helper returns a remover
      disconnectSocket();
    };
  }, [roomCode, navigate, token, user]);

  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          sendMessage({ type: "END_GAME", payload: { roomCode } });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setFruits((prev) =>
        prev
          .map((fruit) => ({
            ...fruit,
            y: fruit.y + fruit.speed,
          }))
          .filter((fruit) => fruit.y < 100)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted]);

  const handleSlice = (fruitId) => {
    const newScore = score + 1;
    setScore(newScore);

    setFruits((prev) => prev.filter((fruit) => fruit.id !== fruitId));

    sendMessage({
      type: "HIT_FRUIT",
      payload: { roomCode, fruitId, userId },
    });
  };

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
