import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
    const [page, setPage] = useState('home');
    const [roomId, setRoomId] = useState('');
    const [userId, setUserId] = useState('');
    const [scores, setScores] = useState({});
    const [ws, setWs] = useState(null);
    const [gameActive, setGameActive] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0); // New state for remaining time

    const handleCreateRoom = async () => {
        const size = prompt('Enter room size:');
        const user = prompt('Enter your username:');
        setUserId(user);

        try {
            const response = await axios.post('http://localhost:5000/create-room', {
                size,
                userId: user,
            });
            setRoomId(response.data.roomId);

            // Immediately join as the creator
            connectWs(response.data.roomId);
            setPage('lobby');
        } catch (err) {
            console.error('Error creating room:', err);
            alert('Failed to create room. Please try again.');
        }
    };

    const handleJoinRoom = async () => {
        try {
            const id = prompt('Enter room ID:');
            const user = prompt('Enter your username:');
            setRoomId(id);
            setUserId(user);
            await axios.post('http://localhost:5000/join-room', { roomId: id, userId: user });
            connectWs(id);
            setPage('lobby');
        } catch (err) {
            console.error('Error joining room:', err.response?.data || err.message);
            alert('Failed to join room. Please check the room ID or try again.');
        }
    };

    const connectWs = (roomId) => {
        const socket = new WebSocket(`ws://localhost:5000/${roomId}`);
        setWs(socket);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'UPDATE_SCORES') {
                setScores(data.scores);
            }

            if (data.type === 'START_GAME') {
                setGameActive(true);
                setRemainingTime(60); // Start with 60 seconds

                // Countdown timer
                const interval = setInterval(() => {
                    setRemainingTime((prevTime) => {
                        if (prevTime <= 1) {
                            clearInterval(interval); // Stop the timer when time reaches 0
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
            }

            if (data.type === 'GAME_OVER') {
                setGameActive(false);
                alert('Game Over! Final Scores: ' + JSON.stringify(data.scores));
                setPage('home');
            }
        };
    };

    const handleStartGame = () => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'START_GAME' }));
        }
    };

    const handleClick = () => {
        if (gameActive && ws) {
            ws.send(JSON.stringify({ type: 'CLICK', userId }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {page === 'home' && (
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Game Lobby</h1>
                    <button
                        onClick={handleCreateRoom}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Create Room
                    </button>
                    <button
                        onClick={handleJoinRoom}
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded"
                    >
                        Join Room
                    </button>
                </div>
            )}
            {page === 'lobby' && (
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Room: {roomId}</h1>
                    <div className="mb-4">
                        {gameActive ? (
                            <div>
                                <h2 className="text-xl font-bold">Time Remaining: {remainingTime}s</h2>
                                <button
                                    onClick={handleClick}
                                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                                >
                                    Click Me!
                                </button>
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={handleStartGame}
                                    className="px-4 py-2 bg-green-500 text-white rounded"
                                >
                                    Start Game
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold">Scores</h2>
                        <ul>
                            {Object.entries(scores).map(([player, score]) => (
                                <li key={player}>
                                    {player}: {score}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
