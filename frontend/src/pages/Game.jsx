import React, { useEffect, useRef, useState } from "react";
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
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fruits, setFruits] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameDuration, setGameDuration] = useState(60);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // 🎮 WS + Game Logic
  useEffect(() => {
    console.log("[Game] ✅ Game component mounted.");
    if (!user) return navigate("/login");

    const ws = connectSocket();

    ws.onopen = () => {
      console.log("✅ WS OPEN - sending JOIN and PING");
      sendMessage({ type: "JOIN_GAME", payload: { roomCode } });
      sendMessage({ type: "PING_DEBUG", payload: "hello from Game.jsx" });
    };

    onMessage((data) => {
      switch (data.type) {
        case "GAME_STARTED":
          setGameStarted(true);
          setGameDuration(data.payload.duration || 60);
          setTimeLeft(data.payload.duration || 60);
          console.log("🎮 Game officially started!");
          break;

        case "FRUIT":
          setFruits((prev) => [...prev, { ...data.payload, id: crypto.randomUUID() }]);
          break;

        case "UPDATE_SCORE":
          setLeaderboard(data.payload.scores);
          break;

        case "END_GAME":
          navigate(`/leaderboard/${roomCode}`);
          break;

        default:
          break;
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [roomCode, navigate]);

  // ⏱️ Game timer
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

  // 🖌️ Drawing Loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("⛔ Canvas not yet mounted, skipping draw setup");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("⛔ Could not get 2D context from canvas");
      return;
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setFruits((prevFruits) => {
        const updated = prevFruits
          .map((fruit) => ({ ...fruit, y: fruit.y + (fruit.speed || 3) }))
          .filter((fruit) => fruit.y < canvas.height + 50);

        updated.forEach((fruit) => {
          ctx.beginPath();
          ctx.arc(fruit.x, fruit.y, fruit.radius || 25, 0, Math.PI * 2);
          ctx.fillStyle = fruit.color || "red";
          ctx.fill();
          ctx.closePath();
        });

        return updated;
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [gameStarted]);

  // 🥷 Handle slicing
  const handleSlice = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hit = false;
    let slicedFruitId = null;

    const updated = fruits.map((fruit) => {
      const dx = fruit.x - x;
      const dy = fruit.y - y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (!fruit.sliced && distance < (fruit.radius || 25) + 10) {
        hit = true;
        slicedFruitId = fruit.id;
        return { ...fruit, y: canvas.height + 100, sliced: true };
      }
      return fruit;
    });

    if (hit) {
      const newScore = score + 1;
      setScore(newScore);

      sendMessage({
        type: "SLICE",
        payload: {
          roomCode,
          fruitId: slicedFruitId,
          userId,
        },
      });

      sendMessage({
        type: "UPDATE_SCORE",
        payload: { roomCode, score: newScore },
      });
    }

    setFruits(updated);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Game Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <h2 className="absolute top-4 left-4 text-lg font-bold">
          Time: {timeLeft}s
        </h2>
        <h2 className="absolute top-4 right-4 text-lg font-bold">
          Score: {score}
        </h2>

        {gameStarted ? (
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="rounded shadow-lg bg-white"
            onClick={handleSlice}
            onMouseMove={(e) => {
              if (e.buttons === 1) handleSlice(e);
            }}
          />
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
