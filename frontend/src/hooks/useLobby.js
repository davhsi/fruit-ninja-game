import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  connectSocket,
  onMessage,
  sendMessage,
} from "@/services/socket/index.js";

const useLobby = (roomCode) => {
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
    } catch {
      toast.error("Corrupted user data.");
      return navigate("/login");
    }

    connectSocket({ token, roomCode });

    const removeListener = onMessage((data) => {
      try {
        console.log("[Lobby] ⬇️ Message received:", data);

        switch (data.type) {
          case "GAME_STARTED": {
            const { roomCode: receivedRoomCode, duration } = data.payload;
            navigate(`/game/${receivedRoomCode}`, {
              state: { roomCode: receivedRoomCode, user: userData, duration },
            });
            break;
          }

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
            console.log("🏓 PONG from server.");
            break;

          default:
            console.warn("⚠️ [Lobby] Unhandled WS message type:", data.type);
        }
      } catch (err) {
        console.error("❌ [Lobby] Error handling WS message:", err, data);
      }
    });

    return () => {
      console.log("[Lobby] Cleanup onMessage");
      removeListener();
    };
  }, [roomCode, navigate]);

  const handleStartGame = () => {
    sendMessage({ type: "START_GAME", roomCode, duration });
  };

  const handleDurationChange = (e) => {
    setDuration(Number(e.target.value));
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  return {
    players,
    user,
    loading,
    hostId,
    duration,
    isHost: user?._id === hostId,
    handleStartGame,
    handleDurationChange,
    copyRoomCode,
  };
};

export default useLobby;
