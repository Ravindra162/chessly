import React, { useState, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { UserContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlayBot = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedTime, setSelectedTime] = useState(600); // 10 minutes default
  const [isCreating, setIsCreating] = useState(false);
  
  const user = useContext(UserContext);
  const socketContext = useContext(SocketContext);
  const socket = socketContext?.socket || socketContext;
  const navigate = useNavigate();

  const difficulties = [
    { 
      value: 'easy', 
      label: 'Easy', 
      description: 'Beginner level - Makes random moves with basic tactics',
      rating: 800,
      color: 'text-green-400'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      description: 'Intermediate level - Looks 2 moves ahead',
      rating: 1200,
      color: 'text-yellow-400'
    },
    { 
      value: 'hard', 
      label: 'Hard', 
      description: 'Advanced level - Looks 3 moves ahead with good tactics',
      rating: 1600,
      color: 'text-orange-400'
    },
    { 
      value: 'expert', 
      label: 'Expert', 
      description: 'Expert level - Looks 4 moves ahead with strong evaluation',
      rating: 2000,
      color: 'text-red-400'
    }
  ];

  const timeControls = [
    { value: 600, label: '10 minutes', description: 'Rapid' }
  ];

  const handleCreateBotGame = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error('Connection lost. Please refresh and try again.');
      return;
    }

    if (!user?.user) {
      toast.error('Please log in to play against bot');
      return;
    }

    setIsCreating(true);

    // Send bot game creation request
    socket.send(JSON.stringify({
      type: 'create_bot_game',
      user: {
        userId: user.user.id,
        username: user.user.username,
        rating: user.user.rating
      },
      difficulty: selectedDifficulty,
      playerColor: selectedColor,
      timeControl: selectedTime
    }));

    // Listen for bot game created response
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'bot_game_created') {
          setIsCreating(false);
          toast.success('Bot game created! Starting game...');
          navigate(`/game/${data.gameId}`);
        } else if (data.type === 'bot_game_error') {
          setIsCreating(false);
          toast.error(data.error || 'Failed to create bot game');
        }
      } catch (error) {
        console.error('Error parsing bot game response:', error);
      }
    };

    // Store original handler
    const originalHandler = socket.onmessage;
    
    // Set combined handler
    socket.onmessage = (event) => {
      // Call original handler first
      if (originalHandler && typeof originalHandler === 'function') {
        originalHandler(event);
      }
      // Then call our handler
      handleMessage(event);
    };

    // Cleanup after 10 seconds if no response
    setTimeout(() => {
      if (isCreating) {
        setIsCreating(false);
        socket.onmessage = originalHandler;
        toast.error('Failed to create bot game. Please try again.');
      }
    }, 10000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 md:p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 md:mb-8">
        Play Against Computer
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Difficulty Selection */}
        <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Choose Difficulty</h3>
          <div className="space-y-3">
            {difficulties.map((difficulty) => (
              <div
                key={difficulty.value}
                onClick={() => setSelectedDifficulty(difficulty.value)}
                className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedDifficulty === difficulty.value
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm md:text-base ${difficulty.color}`}>
                    {difficulty.label}
                  </span>
                  <span className="text-gray-400 text-xs md:text-sm">
                    Rating: {difficulty.rating}
                  </span>
                </div>
                <p className="text-gray-300 text-xs md:text-sm">{difficulty.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Game Settings */}
        <div className="space-y-4 md:space-y-6">
          {/* Color Selection */}
          <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Choose Your Color</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedColor('white')}
                className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                  selectedColor === 'white'
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full mx-auto mb-2"></div>
                  <span className="text-white text-xs md:text-sm">White</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedColor('black')}
                className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                  selectedColor === 'black'
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-800 rounded-full mx-auto mb-2 border border-gray-400"></div>
                  <span className="text-white text-sm">Black</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedColor(Math.random() > 0.5 ? 'white' : 'black')}
                className="p-4 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-all"
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 relative">
                    <div className="w-4 h-8 bg-white rounded-l-full"></div>
                    <div className="w-4 h-8 bg-gray-800 rounded-r-full absolute top-0 right-0 border-l border-gray-400"></div>
                  </div>
                  <span className="text-white text-sm">Random</span>
                </div>
              </button>
            </div>
          </div>

          {/* Time Control */}
          <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Time Control</h3>
            <div className="space-y-2">
              {timeControls.map((time) => (
                <button
                  key={time.value}
                  onClick={() => setSelectedTime(time.value)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTime === time.value
                      ? 'border-[#16A34A] bg-[#16A34A]/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{time.label}</span>
                    <span className="text-gray-400 text-sm">{time.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          <Button
            onClick={handleCreateBotGame}
            isLoading={isCreating}
            disabled={isCreating}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/80 text-white font-bold py-4 text-lg"
            size="lg"
          >
            {isCreating ? 'Creating Game...' : 'Start Game Against Bot'}
          </Button>
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-8 bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 p-6">
        <h3 className="text-xl font-bold text-white mb-4">About Bot Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h4 className="font-semibold text-[#16A34A] mb-2">Features:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Games are counted towards your statistics</li>
              <li>• Rating changes based on bot difficulty</li>
              <li>• All standard chess rules apply</li>
              <li>• Save and review your games</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#16A34A] mb-2">Tips:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Start with easier difficulty to learn</li>
              <li>• Bot thinking time varies by difficulty</li>
              <li>• Practice openings and endgames</li>
              <li>• Analyze your games after playing</li>
            </ul>
          </div>
        </div>
      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

export default PlayBot;
