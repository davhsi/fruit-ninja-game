import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const user = JSON.parse(localStorage.getItem("user")); // assumed set after login/register

  const generateRoomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    navigate(`/lobby/${code}`);
  };

  const joinRoom = () => {
    if (roomCode.length === 6) {
      navigate(`/lobby/${roomCode}`);
    } else {
      alert("Please enter a valid 6-digit room code.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-zinc-800 to-zinc-950 text-white">
      <Card className="w-[400px] p-6 rounded-2xl shadow-xl bg-zinc-900 text-white">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {user?.username || "Ninja"} 👋
          </h1>

          <Button className="w-full mb-4" onClick={generateRoomCode}>
            Create Room
          </Button>

          <div className="mb-4">
            <Label>Join Room</Label>
            <Input
              placeholder="Enter 6-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="mb-2"
            />
            <Button className="w-full" onClick={joinRoom}>
              Join Room
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 bg-zinc-800 text-white border-zinc-600 hover:bg-zinc-700 hover:text-white"
            onClick={() => navigate("/history")}
          >
            View History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
