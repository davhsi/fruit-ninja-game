import { useState, useEffect, useRef } from "react";
import { onMessage, sendMessage } from "@/services/socket/index.js";

const useGame = ({ roomCode, user, gameDuration, navigate }) => {
  const [fruits, setFruits] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const timerRef = useRef(null);
  const fallIntervalRef = useRef(null);
  const isGameRunningRef = useRef(false);

  const handleSlice = (fruitId) => {
    if (!isGameRunningRef.current || !user?._id) return;
  
    setFruits((prev) => prev.filter((fruit) => fruit.id !== fruitId));
    setScore((prev) => prev + 1);
  
    sendMessage({
      type: "HIT_FRUIT", 
      roomCode,
      userId: user._id,
    });
  };
  

  const endGame = () => {
    isGameRunningRef.current = false;
    clearInterval(timerRef.current);
    clearInterval(fallIntervalRef.current);
    setGameOver(true);
    setGameStarted(false);

    sendMessage({ type: "END_GAME", roomCode });
  };

  const startTimer = () => {
    console.log("[Game] ⏱️ Timer started");
    isGameRunningRef.current = true;
    setGameStarted(true);
    setTimeLeft(gameDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          console.log("[Game] 🛑 Time's up!");
          endGame();
          return 0;
        }
        console.log("[Game] ⏲️ Time left:", prev - 1);
        return prev - 1;
      });
    }, 1000);

    fallIntervalRef.current = setInterval(() => {
      setFruits((prevFruits) => {
        const moved = prevFruits
          .map((fruit) => ({ ...fruit, y: fruit.y + fruit.speed }))
          .filter((fruit) => fruit.y < 100);

        console.log("[Game] 🍌 Updated fruit positions:", moved);
        return moved;
      });
    }, 50);
  };

  useEffect(() => {
    console.log("[Game] 🧠 useGame mounted, setting up onMessage handler.");
    const removeListener = onMessage((data) => {
      try {
        console.log("[Game] ⬇️ Message received:", data);

        switch (data.type) {
          case "GAME_STARTED":
            console.log("[Game] 🚀 GAME_STARTED received from backend", data);
            startTimer();
            break;

          case "FRUIT":
            console.log("[Game] 🍒 FRUIT broadcast received:", data.payload);
            setFruits((prev) => [...prev, data.payload]);
            break;

          case "LEADERBOARD_UPDATE":
            console.log("[Game] 📊 Leaderboard updated:", data.leaderboard);
            setLeaderboard(data.leaderboard || []);
            break;

          case "GAME_OVER":
            console.log("[Game] 🏁 GAME_OVER received");
            endGame();
            break;

          case "PING":
            console.log("[Game] 🏓 PING received, replying with PONG");
            sendMessage({ type: "PONG" });
            break;

          default:
            console.warn("[Game] ⚠️ Unhandled message type:", data.type);
        }
      } catch (err) {
        console.error("❌ [Game] Error handling WS message:", err, data);
      }
    });



    return () => {
      console.log("[Game] Cleanup onMessage and intervals");
      removeListener();
      clearInterval(timerRef.current);
      clearInterval(fallIntervalRef.current);
      isGameRunningRef.current = false;
    };
  }, [roomCode, user]);

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

export default useGame;
