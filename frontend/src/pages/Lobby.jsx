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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);

    let isMounted = true; // to prevent state updates on unmounted component
    const ws = connectSocket({ token, roomCode });

    const joinRoom = () => {
      console.log("[Lobby] Sending JOIN_ROOM:", { roomCode, token });
      sendMessage({ type: "JOIN_ROOM", roomCode, token });
    };

    const handleMessage = (data) => {
      console.log("[Lobby] Message received:", data);
    
      switch (data.type) {
        case "PLAYER_LIST":
          if (isMounted) {
            const { players } = data.payload;
            setPlayers(players);
            setLoading(false);
          }
          break;
    
        case "PLAYER_JOINED":
          if (isMounted) {
            setPlayers((prev) => [...prev, data.payload]);
          }
          break;
    
        case "PLAYER_LEFT":
          if (isMounted) {
            setPlayers((prev) => prev.filter((p) => p.id !== data.payload));
          }
          break;
    
        case "GAME_STARTED":
          navigate(`/game/${roomCode}`);
          break;
    
        default:
          break;
      }
    };
    
    // Ensure message listener is set after socket connects
    if (ws.readyState === WebSocket.OPEN) {
      joinRoom();
    } else {
      ws.addEventListener("open", joinRoom);
    }

    onMessage(handleMessage);

    const fallbackTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      disconnectSocket();
      clearTimeout(fallbackTimer);
    };
  }, [roomCode, navigate]);

  // const isHost = players[0]?.id === user?.id;
  const isHost = user?.id === players[0]?.id;

  const handleStartGame = () => {
    sendMessage({ type: "START_GAME", roomCode });
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
        <Button
          variant="ghost"
          size="icon"
          onClick={copyRoomCode}
          title="Copy room code"
        >
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
                {p.id === user?.id && "(You)"}
                {p.id === players[0]?.id &&
                  `${p.id === user?.id ? ", " : ""}(Host)`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isHost && players.length > 1 && (
        <Button className="mt-4 w-full" onClick={handleStartGame}>
          Start Game
        </Button>
      )}
    </div>
  );
};

export default Lobby;
