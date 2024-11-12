import React from 'react';

const Lobby = ({ roomId, userId, ws, finalScores }) => {
    const handleStartGame = () => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'START_GAME', roomId, userId }));
        }
    };

    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
            <p>Welcome, {userId}!</p>

            <button
                onClick={handleStartGame}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
            >
                Start Game
            </button>

            {finalScores && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold">Final Leaderboard</h2>
                    <ul>
                        {Object.entries(finalScores).map(([user, score]) => (
                            <li key={user}>
                                {user}: {score}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Lobby;
