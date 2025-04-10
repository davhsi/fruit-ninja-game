import { useState, useEffect, useRef } from "react";
import { onMessage, sendMessage } from "@/services/socket";

const FRUIT_EMOJIS = ["🍎", "🍌", "🍉", "🍓", "🍍", "🍇", "🥝"];
const FRUIT_INTERVAL_MS = 1000;

export const useGame = ({ roomCode, user, gameDuration = 30, navigate }) => {
  const [fruits, setFruits] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const fruitIdRef = useRef(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const isGameRunningRef = useRef(false);

  // Generate random fruit
  const generateFruit = () => {
    return {
      id: fruitIdRef.current++,
      emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
      x: Math.random() * 90 + 5,
      y: 0,
    };
  };

  // Slice handler
  const handleSlice = (fruitId) => {
    if (!isGameRunningRef.current) return;

    setFruits((prev) => prev.filter((fruit) => fruit.id !== fruitId));
    setScore((prev) => prev + 1);

    sendMessage({
      type: "UPDATE_SCORE",
      roomCode,
      userId: user._id,
      score: 1,
    });
  };

  const endGame = () => {
    isGameRunningRef.current = false;
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setGameOver(true);
    setGameStarted(false);

    sendMessage({
      type: "END_GAME",
      roomCode,
    });
  };

  const startGameLoop = () => {
    isGameRunningRef.current = true;
    setGameStarted(true);

    intervalRef.current = setInterval(() => {
      setFruits((prev) => [...prev, generateFruit()]);
    }, FRUIT_INTERVAL_MS);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const removeListener = onMessage((data) => {
      switch (data.type) {
        case "GAME_OVER":
          console.log("🏁 GAME_OVER received");
          endGame();
          break;

        case "PING":
          sendMessage({ type: "PONG" });
          break;

        case "LEADERBOARD_UPDATE":
          setLeaderboard(data.leaderboard || []);
          break;

        default:
          break;
      }
    });

    return () => {
      removeListener();
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    startGameLoop();
  }, []);

  return {
    fruits,
    score,
    timeLeft,
    gameStarted,
    gameOver,
    handleSlice,
    leaderboard,
  };
};
