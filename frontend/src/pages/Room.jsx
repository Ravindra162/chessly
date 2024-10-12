import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

const Room = () => {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [messages, setMessages] = useState([]); // Store messages from the server
    const socket = useContext(SocketContext);

    useEffect(() => {
        if (!socket) return;

        // Listen for messages from the server
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'connectToRoom':
                    console.log('Connected to room:', data.board);
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        'Connected to room',
                    ]);
                    break;
                case 'update-board':
                    console.log('Board updated:', data.message);
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        'Board updated',
                    ]);
                    break;
                default:
                    console.warn('Unknown message type:', data);
            }
        };
    }, [socket]);

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('name', name);
        localStorage.setItem('roomId', roomId);

        // Send a 'join-room' message to the server
        const joinRoomMessage = JSON.stringify({
            type: 'join-room',
            name,
            roomId,
        });
        socket.send(joinRoomMessage);
    };

    return (
        <div className="flex flex-col items-center mt-12">
            <h1 className="text-2xl font-bold mb-6">Join a Room</h1>
            <form onSubmit={handleSubmit} className="flex flex-col w-72">
                <label className="mb-2">
                    Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </label>
                <label className="mb-4">
                    Room ID:
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </label>
                <button type="submit" className="p-2 bg-blue-500 text-white rounded">
                    Join Room
                </button>
            </form>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Messages:</h2>
                <ul className="list-disc">
                    {messages.map((msg, index) => (
                        <li key={index} className="mb-2">
                            {msg}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Room;
