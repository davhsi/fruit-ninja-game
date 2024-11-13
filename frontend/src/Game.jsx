import React, { useState, useEffect, useRef } from "react";

// Define fruits and bombs
const fruits = ["🍎", "🍌", "🍍", "🍓"];
const halfSlicedFruit = ["🍉"]; // Half-sliced fruit emoji (can be changed as desired)
const bombs = ["💣"];

const Game = ({ roomId, userId, ws, liveScores }) => {
  const [fallingObjects, setFallingObjects] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef(null);

  // Spawn fruits and bombs
  useEffect(() => {
    const spawnObject = () => {
      if (gameOver) return; // Stop spawning objects if the game is over
      const objectType = Math.random() < 0.8 ? "fruit" : "bomb"; // 80% chance for fruit, 20% for bomb
      const object =
        objectType === "fruit"
          ? fruits[Math.floor(Math.random() * fruits.length)]
          : bombs[0];
      const id = Date.now();
      const left = Math.random() * 90;
      const top = 0;
      setFallingObjects((prev) => [
        ...prev,
        { id, object, left, top, type: objectType, sliced: false },
      ]);

      // Remove the object after falling for 3 seconds
      setTimeout(() => {
        setFallingObjects((prev) => prev.filter((obj) => obj.id !== id));
      }, 3000);
    };

    // Spawn objects every second
    const interval = setInterval(spawnObject, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Timer logic
  useEffect(() => {
    if (gameOver) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setGameOver(true); // End the game
          // Send game over signal to the server
          if (ws) {
            ws.send(JSON.stringify({ type: "GAME_OVER", userId }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [gameOver, ws, userId]);

  // Handle object click (fruit slicing or bomb defusing)
 const handleClick = (id, type) => {
  if (type === "bomb") {
    if (!fallingObjects.find((obj) => obj.id === id)?.sliced) {
      // If it's not already sliced (clicked)
      setScore((prev) => prev - 1); // Bomb gives negative points
      // Change bomb to skull emoji
      setFallingObjects((prev) =>
        prev.map((obj) =>
          obj.id === id ? { ...obj, object: "💀", sliced: true } : obj
        )
      );
    }
  } else {
    // Fruit slicing behavior
    if (!fallingObjects.find((obj) => obj.id === id)?.sliced) {
      setFallingObjects((prev) =>
        prev.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                object: halfSlicedFruit[0], // Change to half-sliced fruit
                sliced: true, // Mark fruit as sliced
              }
            : obj
        )
      );
      setScore((prev) => prev + 1); // Fruit gives positive points
    }
  }

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
      ref={gameAreaRef}
      className="relative h-screen w-full bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden knife-cursor"
    >
      {/* Timer Display */}
      <div className="absolute top-0 left-0 p-4 text-2xl font-bold text-white">
        Timer: {gameOver ? "Game Over" : `${timer}s`}
      </div>

      {/* Live Leaderboard */}
      <div className="absolute top-0 right-0 p-4 text-white">
        <h3 className="text-xl font-bold text-gray-800">Live Leaderboard</h3>
        <ul className="text-gray-900">
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
          className={`absolute text-4xl ${
            obj.type === "bomb" ? "bomb" : "fruit"
          } ${obj.sliced ? "animate-sliced" : ""}`}
          style={{
            left: `${obj.left}%`,
            top: `${obj.top}%`,
            animation: `fall 3s linear forwards`,
          }}
          onClick={() => handleClick(obj.id, obj.type)}
        >
          {obj.object}
        </div>
      ))}
    </div>
  );
};

export default Game;
