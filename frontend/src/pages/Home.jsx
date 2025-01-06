import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import Navbar from "../components/Navbar";
import { UserContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Matches from '../components/Matches';

const Home = () => {
  const [User, setUser] = useState("");
  const user = useContext(UserContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    if(user !== null) setUser(user);
  }, [user]);

  const handleMatchMaking = () => {
    if(socket) {
      socket.send(JSON.stringify({type:"start_10", userId:User.user.id}));
      navigate("/ten/");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8 mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome, {User === '' ? "Loading..." : User.user.username}
          </h1>
          <Button 
            onClick={handleMatchMaking} 
            className="bg-[#16A34A] hover:bg-[#15803d] text-white px-8 py-6 text-lg rounded-lg shadow-lg shadow-[#16A34A]/20 transition-colors"
          >
            Play Random (10 Min Match)
          </Button>
        </div>
        <Matches />
      </div>
    </div>
  );
};

export default Home;