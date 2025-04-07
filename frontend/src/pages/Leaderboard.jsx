import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { connectSocket, sendMessage, onMessage, disconnectSocket } from "@/services/socket";
import { Button } from "@/components/ui/button";

const Leaderboard = () => {
  const { roomCode } = useParams();
  const [finalScores, setFinalScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return navigate("/login");

    const ws = connectSocket();

    ws.onopen = () => {
      console.log("[WS] Connected to leaderboard");
      sendMessage({ type: "GET_FINAL_SCORES", roomCode });
    };

    onMessage((data) => {
      if (data.type === "FINAL_SCORES") {
        const sorted = [...data.payload].sort((a, b) => b.score - a.score);
        setFinalScores(sorted);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [roomCode, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">🏆 Final Leaderboard</h1>

      <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
        <ol className="space-y-2">
          {finalScores.map((player, index) => (
            <li key={player.id} className="flex justify-between items-center">
              <span className="font-semibold">
                {index + 1}. {player.username}
              </span>
              <span className="text-blue-600 font-bold">{player.score}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex gap-4">
        <Button onClick={() => navigate("/")}>🏠 Home</Button>
        <Button onClick={() => navigate("/history")}>📜 Match History</Button>
      </div>
    </div>
  );
};

export default Leaderboard;
