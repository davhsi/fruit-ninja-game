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

  // 🍉 Fruit Spawning
  useEffect(() => {
    const canvas = canvasRef.current;
    const spawnInterval = setInterval(() => {
      const fruit = {
        x: Math.random() * canvas.width,
        y: 0,
        radius: 25,
        speed: 4 + Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      };
      setFruits((prev) => [...prev, fruit]);
    }, 1000);

    return () => clearInterval(spawnInterval);
  }, []);

  // 🎮 Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setFruits((prevFruits) =>
        prevFruits
          .map((fruit) => ({
            ...fruit,
            y: fruit.y + fruit.speed,
          }))
          .filter((fruit) => fruit.y < canvas.height)
      );

      fruits.forEach((fruit) => {
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = fruit.color;
        ctx.fill();
        ctx.closePath();
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [fruits]);

  // 🥷 Fruit Slicing
  const handleSlice = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hit = false;

    const updated = fruits.map((fruit) => {
      const dx = fruit.x - x;
      const dy = fruit.y - y;
      if (Math.sqrt(dx ** 2 + dy ** 2) < fruit.radius + 10) {
        hit = true;
        return { ...fruit, y: canvas.height + 100 };
      }
      return fruit;
    });

    if (hit) {
      const newScore = score + 1;
      setScore(newScore);
      sendMessage({
        type: "UPDATE_SCORE",
        payload: { roomCode, score: newScore },
      });
    }

    setFruits(updated);
  };

  // ⏱️ Game Logic & WS Init
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    const ws = connectSocket();

    // Join game
    ws.onopen = () => {
      sendMessage({ type: "JOIN_GAME", payload: { roomCode } });
    };

    // Incoming messages
    onMessage((data) => {
      if (data.type === "UPDATE_SCORE") {
        setLeaderboard(data.payload.scores);
      }

      if (data.type === "END_GAME") {
        navigate(`/leaderboard/${roomCode}`);
      }
    });

    // Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          sendMessage({ type: "END_GAME", payload: { roomCode } });
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      disconnectSocket();
    };
  }, [roomCode, navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Game Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <h2 className="absolute top-4 left-4 text-lg font-bold">
          Time: {timeLeft}s
        </h2>
        <h2 className="absolute top-4 right-4 text-lg font-bold">
          Score: {score}
        </h2>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="rounded shadow-lg bg-white"
          onClick={handleSlice}
        />
      </div>

      {/* Leaderboard */}
      <LeaderboardPanel leaderboard={leaderboard} />
    </div>
  );
};

export default Game;
