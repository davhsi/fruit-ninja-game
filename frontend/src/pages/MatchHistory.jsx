import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, sendMessage, onMessage, disconnectSocket } from "@/services/socket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MatchHistory = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user) return navigate("/login");

    const ws = connectSocket();

    ws.onopen = () => {
      console.log("[WS] Connected for match history");
      sendMessage({ type: "GET_MATCH_HISTORY", token });
    };

    onMessage((data) => {
      if (data.type === "MATCH_HISTORY") {
        setHistory(data.data);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📜 Match History</h1>

      {history.length === 0 ? (
        <p className="text-gray-500">No matches found.</p>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          {history.map((match, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Room: {match.roomCode}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(match.endedAt).toLocaleString()}
                </span>
              </div>

              <ul className="space-y-1">
                {match.players.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.username}</span>
                    <span className="text-blue-600 font-semibold">{p.score}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Button className="mt-6" onClick={() => navigate("/")}>🏠 Back to Home</Button>
    </div>
  );
};

export default MatchHistory;
