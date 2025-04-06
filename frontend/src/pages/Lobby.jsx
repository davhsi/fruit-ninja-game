import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSocket } from "../contexts/SocketContext";
import { toast } from "sonner"; // if you're using a toast library
import { Copy } from "lucide-react"; // optional icon

const Lobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
  
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  
    if (!socket) return;
  
    socket.emit("join-room", { roomCode, token });
  
    socket.on("message", (data) => {
      switch (data.type) {
        case "PLAYER_LIST":
          setPlayers(data.payload);
          setLoading(false);
          break;
  
        case "PLAYER_JOINED":
          setPlayers((prev) => [...prev, data.payload]);
          break;
  
        case "PLAYER_LEFT":
          setPlayers((prev) => prev.filter((p) => p.id !== data.payload));
          break;
  
        case "GAME_STARTED":
          navigate(`/game/${roomCode}`);
          break;
  
        default:
          break;
      }
    });
  
    return () => {
      socket.emit("leave-room", { roomCode });
      socket.off("message");
    };
  }, [socket, roomCode, navigate]);
  

  const isHost = players[0]?.id === user?.id;

  const handleStartGame = () => {
    socket.emit("start-game", { roomCode });
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
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">{roomCode}</code>
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
              {p.id === user?.id && <span className="text-xs text-blue-500">(You)</span>}
              {p.id === players[0]?.id && <span className="text-xs text-green-500">(Host)</span>}
            </li>
          ))}
        </ul>
      </Card>

      {isHost && (
        <Button onClick={handleStartGame} className="mt-6">
          Start Game
        </Button>
      )}
    </div>
  );
};

export default Lobby;
