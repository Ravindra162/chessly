import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import Navbar from "../components/Navbar";
import { UserContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Matches from '../components/Matches';
import Friends from '../components/Friends';

const Home = () => {
  const [User, setUser] = useState("");
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const user = useContext(UserContext);
  const socketContext = useContext(SocketContext);
  const socket = socketContext?.socket || socketContext; // Handle both old and new context structures
  const isConnected = socketContext?.isConnected !== undefined ? socketContext.isConnected : (socket?.readyState === WebSocket.OPEN);
  const navigate = useNavigate();

  useEffect(() => {
    if(user !== null) setUser(user);
  }, [user]);

  // Add message handler for game creation
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const handleMessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log("Received message in Home:", parsedData);
          
          if (parsedData.type === 'game_created_10') {
            console.log("Game created, navigating to game");
            setIsMatchmaking(false);
            navigate(`/game/${parsedData.gameId}`);
          } else if (parsedData.type === 'redirect_to_game') {
            console.log("Redirecting to existing game");
            setIsMatchmaking(false);
            navigate(`/game/${parsedData.gameId}`);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, navigate]);

  const handleMatchMaking = () => {
    console.log("HandleMatchMaking called");
    console.log("Socket state:", socket ? "exists" : "null");
    console.log("Socket readyState:", socket?.readyState);
    console.log("Is connected:", isConnected);
    console.log("Is matchmaking:", isMatchmaking);
    
    if(socket && socket.readyState === WebSocket.OPEN && !isMatchmaking && isConnected) {
      setIsMatchmaking(true);
      console.log("Sending create_10 message");
      
      const message = {
        type: "create_10", 
        user: { username: User.user.username, userId: User.user.id }
      };
      
      console.log("Message to send:", message);
      socket.send(JSON.stringify(message));
      
      // Don't navigate immediately - wait for server response
      // The navigation will happen in the message handler
      
      // Add a timeout to reset matchmaking state if no response
      setTimeout(() => {
        if (isMatchmaking) {
          console.log("Matchmaking timeout - no response from server");
          setIsMatchmaking(false);
          alert("Matchmaking failed. Please try again.");
        }
      }, 10000); // 10 second timeout
    } else {
      console.log("Cannot send message - conditions not met");
      if (!socket) console.log("No socket");
      if (socket && socket.readyState !== WebSocket.OPEN) console.log("Socket not open, state:", socket.readyState);
      if (!isConnected) console.log("Not connected");
      if (isMatchmaking) console.log("Already matchmaking");
      
      alert("Connection not ready. Please wait and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span>Connecting...</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8 mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome, {User === '' ? "Loading..." : User.user.username}
          </h1>
          
          {/* Connection status for debugging */}
          <div className="text-sm text-gray-400">
            Status: {isConnected ? "Connected" : "Disconnected"}
          </div>
          
          <Button 
            onClick={handleMatchMaking} 
            isLoading={isMatchmaking}
            disabled={isMatchmaking || !isConnected}
            className={`${
              isMatchmaking || !isConnected 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-[#16A34A] hover:bg-[#15803d]'
            } text-white px-8 py-6 text-lg rounded-lg shadow-lg shadow-[#16A34A]/20 transition-colors`}
          >
            {!isConnected 
              ? "Connecting..." 
              : isMatchmaking 
                ? "Finding Match..." 
                : "Play Random (10 Min Match)"
            }
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Matches />
          <Friends />
        </div>
      </div>
    </div>
  );
};

export default Home;