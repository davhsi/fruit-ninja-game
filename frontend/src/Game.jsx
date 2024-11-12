import React, { useState, useEffect, useRef } from "react";

const fruits = ["🍎", "🍌", "🍇", "🍊", "🍒"];
const bombs = ["💣"];

const Game = ({ roomId, userId, ws, liveScores }) => {
  const [fallingObjects, setFallingObjects] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef(null);

  // Handle fruit and bomb spawning
  useEffect(() => {
    const spawnObject = () => {
      const objectType = Math.random() < 0.8 ? "fruit" : "bomb"; // 80% chance for fruit, 20% for bomb
      const object =
        objectType === "fruit"
          ? fruits[Math.floor(Math.random() * fruits.length)]
          : bombs[0]; // Only one type of bomb for now
      const id = Date.now();
      const left = Math.random() * 90; // Position objects randomly across the screen width
      setFallingObjects((prev) => [
        ...prev,
        { id, object, left, type: objectType },
      ]);

      // Remove object if it reaches the bottom of the screen
      setTimeout(() => {
        setFallingObjects((prev) => prev.filter((obj) => obj.id !== id));
      }, 3000); // Match the duration of the animation
    };

    const interval = setInterval(spawnObject, 1000); // Spawn an object every second

    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameOver) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setGameOver(true);
          // Send game over signal to server
          if (ws) {
            ws.send(JSON.stringify({ type: "GAME_OVER", userId }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [gameOver]);

  // Handle object click (fruit slicing or bomb defusing)
  const handleSlice = (id, type) => {
    if (type === "bomb") {
      setScore((prev) => prev - 1); // Bomb gives negative points
    } else {
      setScore((prev) => prev + 1); // Fruit gives positive points
    }
    setFallingObjects((prev) => prev.filter((obj) => obj.id !== id));

    // Send score update to the server via WebSocket
    if (ws) {
      ws.send(JSON.stringify({ type: "SLICE", userId }));
    }
  };

  // Sort live leaderboard
  const sortedScores = Object.entries(liveScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([user, score], index) => ({ user, score, rank: index + 1 }));

  return (
    <div
      className="relative h-screen w-full bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden sword-cursor"
      ref={gameAreaRef}
    >
      {/* Timer Display */}
      <div className="absolute top-0 left-0 p-4 text-2xl font-bold text-white">
        Timer: {timer}s
      </div>

      {/* Live Leaderboard */}
      <div className="absolute top-0 right-0 p-4 text-white">
        <h3 className="text-xl font-bold text-gray-800">Live Leaderboard</h3>{" "}
        {/* Use a darker color for the header */}
        <ul className="text-gray-900">
          {" "}
          {/* Darker color for the player list */}
          {sortedScores.map(({ user, score, rank }) => (
            <li
              key={user}
              className={`rank ${
                rank === 1
                  ? "text-yellow-500"
                  : rank === 2
                  ? "text-gray-500"
                  : ""
              }`}
            >
              <span>{rank}.</span> {user}: {score}
            </li>
          ))}
        </ul>
      </div>

      {/* Display the score */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-4 text-2xl font-bold text-white">
        Score: {score}
      </div>

      {/* Render falling fruits and bombs */}
      {fallingObjects.map((obj) => (
        <div
          key={obj.id}
          className={`absolute cursor-pointer text-4xl animate-fall ${
            obj.type === "bomb" ? "bomb" : ""
          }`}
          style={{
            left: `${obj.left}%`, // Set horizontal position
            top: "-10%", // Start slightly above the visible area
          }}
          onClick={() => handleSlice(obj.id, obj.type)}
        >
          {obj.object}
        </div>
      ))}
    </div>
  );
};

export default Game;
