import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  connectSocket,
  sendMessage,
  onMessage,
  disconnectSocket,
} from "@/services/socket";
import Leaderboard from "@/components/LeaderboardPanel";
import { Button } from "@/components/ui/button";

const LeaderboardPage = () => {
  const { roomCode } = useParams();
  const [finalScores, setFinalScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    const cachedRoom = localStorage.getItem("finalRoomCode");
    const cachedBoard = localStorage.getItem("finalLeaderboard");

    if (cachedRoom === roomCode && cachedBoard) {
      console.log("[LeaderboardPage] ✅ Using cached leaderboard");
      setFinalScores(JSON.parse(cachedBoard));
      return;
    }

    const ws = connectSocket();

    ws.onopen = () => {
      console.log("[LeaderboardPage] 🧠 WS connected, requesting scores");
      sendMessage({ type: "GET_FINAL_SCORES", roomCode });
    };

    const removeListener = onMessage((data) => {
      if (data.type === "FINAL_SCORES" || data.type === "LEADERBOARD_UPDATE") {
        const scores = [...(data.payload || data.leaderboard)].sort(
          (a, b) => b.score - a.score
        );
        setFinalScores(scores);
        localStorage.setItem("finalLeaderboard", JSON.stringify(scores));
        localStorage.setItem("finalRoomCode", roomCode);
      }
    });

    return () => {
      disconnectSocket();
      removeListener?.();
    };
  }, [roomCode, navigate]);

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">🏆 Final Leaderboard</h1>

      <Leaderboard scores={finalScores} highlightUserId={user?._id} />

      <div className="mt-6 flex gap-4">
        <Button onClick={() => navigate("/home")}>🏠 Home</Button>
        <Button onClick={() => navigate("/history")}>📜 Match History</Button>
      </div>
    </div>
  );
};

export default LeaderboardPage;
