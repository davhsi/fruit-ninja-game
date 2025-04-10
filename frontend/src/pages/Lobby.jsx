import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import {
  connectSocket,
  sendMessage,
  onMessage,
  disconnectSocket,
} from "@/services/socket";

const Lobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hostId, setHostId] = useState(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      toast.error("Please log in again.");
      return navigate("/login");
    }

    let userData;
    try {
      userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (err) {
      toast.error("Corrupted user data.");
      return navigate("/login");
    }

    let isMounted = true;
    const ws = connectSocket({ token, roomCode });

    const handleMessage = (data) => {
      if (!isMounted) return;
      console.log("[Lobby] ⬇️ Message received:", data);

      switch (data.type) {
        case "GAME_STARTED":
          console.log("[Lobby] 🎮 GAME_STARTED received. Navigating...");
          navigate(`/game/${roomCode}`);
          break;

        case "PLAYER_LIST":
          setPlayers(data.payload.players);
          setHostId(data.payload.hostId);
          setLoading(false);
          break;

        case "PLAYER_JOINED":
          setPlayers((prev) => [...prev, data.payload]);
          break;

        case "PLAYER_LEFT":
          setPlayers((prev) => prev.filter((p) => p.id !== data.payload));
          break;

        case "PONG":
          console.log("🏓 PONG received from server.");
          break;

        default:
          console.warn("Unhandled WS message type:", data.type);
      }
    };

    const removeListener = onMessage(handleMessage); // ✅ track it for cleanup
    // sendMessage({ type: "JOIN_ROOM", token, roomCode }); // 🔥 rejoin room

    return () => {
      isMounted = false;
      removeListener(); // ✅ cleanup listener only for this component
      // disconnectSocket(); // optional: leave socket alive for reuse
    };
  }, [roomCode, navigate]);

  const isHost = user?._id === hostId;

  const handleStartGame = () => {
    console.log("[Lobby] 🔼 Sending START_GAME event...");
    sendMessage({ type: "START_GAME", roomCode, duration });
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Connecting to lobby...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-4">Lobby</h1>

      <div className="flex items-center space-x-2 mb-6">
        <p className="text-gray-500 text-sm">Room Code:</p>
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
          {roomCode}
        </code>
        <Button variant="ghost" size="icon" onClick={copyRoomCode}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <Card className="w-full max-w-md p-4">
        <h2 className="text-xl font-semibold mb-3">Players in Room</h2>
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="bg-muted px-3 py-2 rounded flex justify-between items-center"
            >
              <span>{p.username}</span>
              <span className="text-xs text-muted-foreground">
                {p.id === user?._id && "(You)"}
                {p.id === hostId && `${p.id === user?._id ? ", " : ""}(Host)`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isHost && players.length > 1 && (
        <div className="w-full max-w-md mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Duration:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-background"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
            </select>
          </div>

          <Button className="w-full" onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default Lobby;
