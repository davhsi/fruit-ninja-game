import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ✅ add this!
import { onMessage, sendMessage } from "@/services/socket/index.js";

const useGame = ({ roomCode, user, gameDuration }) => {
  const navigate = useNavigate(); // ✅ now internal

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

  const startTimer = () => {
    console.log("[Game] ⏱️ Timer started");
    isGameRunningRef.current = true;
    setGameStarted(true);
    setTimeLeft(gameDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          console.log("[Game] 🛑 Time's up!");
          clearInterval(timerRef.current);
          clearInterval(fallIntervalRef.current);
          isGameRunningRef.current = false;

          // ✅ Let backend handle game end (and send END_GAME)
          sendMessage({ type: "END_GAME", roomCode });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    fallIntervalRef.current = setInterval(() => {
      setFruits((prevFruits) =>
        prevFruits
          .map((fruit) => ({ ...fruit, y: fruit.y + fruit.speed }))
          .filter((fruit) => fruit.y < 100)
      );
    }, 50);
  };

  useEffect(() => {
    console.log("[Game] 🧠 useGame mounted, setting up onMessage handler.");
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
            console.log("[Game] 🏁 END_GAME received");
            clearInterval(timerRef.current);
            clearInterval(fallIntervalRef.current);
            isGameRunningRef.current = false;

            const finalBoard = data.payload.leaderboard || [];
            localStorage.setItem(
              "finalLeaderboard",
              JSON.stringify(finalBoard)
            );
            localStorage.setItem("finalRoomCode", roomCode);

            // 🔁 Navigate to Leaderboard page
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
      console.log("[Game] Cleanup onMessage and intervals");
      removeListener();
      clearInterval(timerRef.current);
      clearInterval(fallIntervalRef.current);
      isGameRunningRef.current = false;
    };
  }, [roomCode]);

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
