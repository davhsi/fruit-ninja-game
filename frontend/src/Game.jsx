import React, { useState, useEffect, useRef } from 'react';

const fruits = ['🍎', '🍌', '🍇', '🍊', '🍒'];

const Game = ({ roomId, userId, ws, liveScores }) => {
    const [fallingFruits, setFallingFruits] = useState([]);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(60);  // Timer state
    const [gameOver, setGameOver] = useState(false);
    const gameAreaRef = useRef(null);

    // Handle fruit spawning
    useEffect(() => {
        const spawnFruit = () => {
            const fruit = fruits[Math.floor(Math.random() * fruits.length)];
            const id = Date.now();
            const left = Math.random() * 90; // Position fruits randomly across the screen width
            setFallingFruits((prev) => [...prev, { id, fruit, left }]);

            // Remove fruit if it reaches the bottom of the screen
            setTimeout(() => {
                setFallingFruits((prev) => prev.filter((f) => f.id !== id));
            }, 3000); // Match the duration of the animation
        };

        const interval = setInterval(spawnFruit, 1000); // Spawn a fruit every second

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
                        ws.send(JSON.stringify({ type: 'GAME_OVER', userId }));
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [gameOver]);

    // Handle sword click (fruit slicing)
    const handleSlice = (id) => {
        setFallingFruits((prev) => prev.filter((f) => f.id !== id));
        setScore((prev) => prev + 1);

        // Send score update to the server via WebSocket
        if (ws) {
            ws.send(JSON.stringify({ type: 'SLICE', userId }));
        }
    };

    return (
        <div className="relative h-screen w-full bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden sword-cursor" ref={gameAreaRef}>
            {/* Timer Display */}
            <div className="absolute top-0 left-0 p-4 text-2xl font-bold text-white">
                Timer: {timer}s
            </div>

            {/* Live Leaderboard */}
            <div className="absolute top-0 right-0 p-4 text-white">
                <h3 className="text-xl font-bold">Live Leaderboard</h3>
                <ul>
                    {Object.entries(liveScores).map(([user, score]) => (
                        <li key={user}>
                            {user}: {score}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Display the score */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-4 text-2xl font-bold text-white">
                Score: {score}
            </div>

            {/* Render falling fruits */}
            {fallingFruits.map((fruit) => (
                <div
                    key={fruit.id}
                    className="absolute cursor-pointer text-4xl animate-fall"
                    style={{
                        left: `${fruit.left}%`, // Set horizontal position
                        top: '-10%', // Start slightly above the visible area
                    }}
                    onClick={() => handleSlice(fruit.id)}
                >
                    {fruit.fruit}
                </div>
            ))}
        </div>
    );
};

export default Game;
