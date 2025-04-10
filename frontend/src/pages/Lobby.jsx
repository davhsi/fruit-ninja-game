import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import useLobby from "@/hooks/useLobby";

const Lobby = () => {
  const { roomCode } = useParams();
  const {
    players,
    user,
    loading,
    hostId,
    duration,
    isHost,
    handleStartGame,
    handleDurationChange,
    copyRoomCode,
  } = useLobby(roomCode);

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
              onChange={handleDurationChange}
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
