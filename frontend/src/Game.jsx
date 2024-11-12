import React, { useEffect, useState } from 'react';

const fruits = ['🍎', '🍌', '🍇', '🍊', '🍒'];

const Game = ({ ws, userId, liveScores, timer }) => {
    const [fallingFruits, setFallingFruits] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const spawnFruit = () => {
            const fruit = fruits[Math.floor(Math.random() * fruits.length)];
            const id = Date.now();
            const left = Math.random() * 90;
            setFallingFruits((prev) => [...prev, { id, fruit, left }]);

            setTimeout(() => {
                setFallingFruits((prev) => prev.filter((f) => f.id !== id));
            }, 3000);
        };

        const interval = setInterval(spawnFruit, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSlice = (id) => {
        setFallingFruits((prev) => prev.filter((f) => f.id !== id));
        setScore((prev) => prev + 1);

        if (ws) {
            ws.send(JSON.stringify({ type: 'SLICE', userId }));
        }
    };

    return (
        <div className="relative h-screen w-full bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden">
            {/* Display the timer and score */}
            <div className="absolute top-0 left-0 p-4 flex flex-col space-y-2">
                <h2 className="text-2xl font-bold">Time Left: {timer}s</h2>
                <h2 className="text-2xl font-bold">Score: {score}</h2>
            </div>

            {/* Display live leaderboard */}
            <div className="absolute top-0 right-0 p-4 bg-white rounded shadow-lg">
                <h3 className="text-lg font-semibold">Live Leaderboard</h3>
                <ul>
                    {Object.entries(liveScores).map(([user, userScore]) => (
                        <li key={user}>
                            {user}: {userScore}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Render falling fruits */}
            {fallingFruits.map((fruit) => (
                <div
                    key={fruit.id}
                    className="absolute cursor-pointer text-4xl animate-fall"
                    style={{
                        left: `${fruit.left}%`,
                        top: '-10%',
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
