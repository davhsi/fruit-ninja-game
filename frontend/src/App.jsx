import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Room from './Lobby';
import Game from './Game';

const App = () => {
    const [page, setPage] = useState('home');
    const [roomId, setRoomId] = useState('');
    const [userId, setUserId] = useState('');
    const [ws, setWs] = useState(null);
    const [finalScores, setFinalScores] = useState(null); 
    const [liveScores, setLiveScores] = useState({});
    const [timer, setTimer] = useState(60); // 60-second timer

    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received WebSocket message:', data);

                if (data.type === 'START_GAME') {
                    setPage('game');
                    setTimer(60); // Reset timer to 60 seconds at game start
                    startTimer();
                }
                if (data.type === 'UPDATE_SCORES') {
                    setLiveScores(data.scores);
                }
                if (data.type === 'GAME_OVER') {
                    setFinalScores(data.scores);
                    setPage('lobby');
                }
            };
        }

        return () => {
            if (ws) ws.onmessage = null; 
        };
    }, [ws]);

    const startTimer = () => {
        const countdown = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

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

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        socket.onerror = (err) => {
            console.error('WebSocket error:', err);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {page === 'home' && (
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Fruit Ninja Game</h1>
                    <button onClick={handleCreateRoom} className="px-4 py-2 bg-blue-500 text-white rounded">
                        Create Room
                    </button>
                    <button onClick={handleJoinRoom} className="ml-4 px-4 py-2 bg-green-500 text-white rounded">
                        Join Room
                    </button>
                </div>
            )}

            {page === 'lobby' && (
                <Room
                    roomId={roomId}
                    userId={userId}
                    ws={ws}
                    setPage={setPage}
                    finalScores={finalScores}
                />
            )}

            {page === 'game' && (
                <Game
                    ws={ws}
                    userId={userId}
                    liveScores={liveScores}
                    timer={timer}
                />
            )}
        </div>
    );
};

export default App;
