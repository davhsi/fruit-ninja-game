import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onMessage, sendMessage } from "@/services/socket/index.js";

const useGame = ({ roomCode, user, gameDuration }) => {
  const navigate = useNavigate();

  const [fruits, setFruits] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
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

  const startTimer = () => {
    if (isGameRunningRef.current) {
      console.warn("[Game] ⚠️ Timer already running — ignoring duplicate GAME_STARTED");
      return;
    }

    console.log("[Game] ⏱️ Timer started");
    isGameRunningRef.current = true;
    setGameStarted(true);
    setTimeLeft(gameDuration);

    // Game countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          console.log("[Game] 🛑 Time's up!");
          clearInterval(timerRef.current);
          clearInterval(fallIntervalRef.current);
          isGameRunningRef.current = false;
          sendMessage({ type: "END_GAME", roomCode });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fruit falling logic
    fallIntervalRef.current = setInterval(() => {
      setFruits((prevFruits) =>
        prevFruits
          .map((fruit) => ({ ...fruit, y: fruit.y + fruit.speed }))
          .filter((fruit) => fruit.y < 100)
      );
    }, 50);
  };

  useEffect(() => {
    console.log("[Game] 🧠 useGame mounted — setting up onMessage listener");

    const removeListener = onMessage((data) => {
      try {
        console.log("[Game] ⬇️ Message received:", data);

        switch (data.type) {
          case "GAME_STARTED":
            console.log("[Game] 🚀 GAME_STARTED received from backend");
            startTimer();
            break;

          case "FRUIT":
            setFruits((prev) => [...prev, data.payload]);
            break;

          case "LEADERBOARD_UPDATE":
            setLeaderboard(data.payload || []);
            break;

          case "END_GAME":
            console.log("[Game] 🏁 END_GAME received — cleaning up");
            clearInterval(timerRef.current);
            clearInterval(fallIntervalRef.current);
            isGameRunningRef.current = false;

            const finalBoard = data.payload.leaderboard || [];
            localStorage.setItem("finalLeaderboard", JSON.stringify(finalBoard));
            localStorage.setItem("finalRoomCode", roomCode);

            navigate(`/leaderboard/${roomCode}`);
            break;

          case "PING":
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
      console.log("[Game] 🧹 Cleanup — removing listener and intervals");
      removeListener();
      clearInterval(timerRef.current);
      clearInterval(fallIntervalRef.current);
      isGameRunningRef.current = false;
    };
  }, [roomCode, navigate]);

  return {
    fruits,
    score,
    timeLeft,
    gameStarted,
    handleSlice,
    leaderboard,
  };
};

export default useGame;
