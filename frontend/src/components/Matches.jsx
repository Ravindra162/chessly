import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@nextui-org/react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from './Loading';

const Matches = () => {
  const [games, setGames] = useState([]);
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [copyingPgn, setCopyingPgn] = useState({});

  const getEnvironmentUrl = () => {
    if (import.meta.env.VITE_ENVIRONMENT === 'production') {
      return import.meta.env.VITE_BACKEND_URL || 'https://chessly-backend.vercel.app';
    }
    return 'http://localhost:5000';
  };

  useEffect(() => {
    axios.get(`${getEnvironmentUrl()}/user/games`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
      }
    })
    .then(res => 
        {
            setIsLoading(true);
            setGames(res.data.games);
            setIsLoading(false);
        
        }
    )
    .catch(err => console.error(err));
  }, []);

  const handleCopyPgn = (pgn, gameId) => {
    setCopyingPgn(prev => ({ ...prev, [gameId]: true }));
    navigator.clipboard.writeText(pgn)
      .then(() => {
        toast.success("PGN copied to clipboard");
        setTimeout(() => {
          setCopyingPgn(prev => ({ ...prev, [gameId]: false }));
        }, 2000);
      })
      .catch(err => {
        console.error(err);
        setCopyingPgn(prev => ({ ...prev, [gameId]: false }));
      });
  };

  const handleViewGame = (gameId) => {
    navigate(`/view-game?gameId=${gameId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
       
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
        Recent Matches
      </h2>
      {isLoading ? <Loading />:
        <div className="bg-[#111] rounded-xl shadow-lg shadow-[#16A34A]/10 overflow-hidden">
        <div className="divide-y divide-gray-800">
          {games.length ? (
            games.map((game, index) => (
              <div key={index} className="p-4 hover:bg-black/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className={`flex-1 text-center ${game.winnerId !== user.user.id ? 'text-[#16A34A]' : 'text-red-500'}`}>
                    {game.whiteUsername} (W)
                  </div>
                  <div className="text-gray-400">vs</div>
                  <div className={`flex-1 text-center ${game.winnerId === user.user.id ? 'text-[#16A34A]' : 'text-red-500'}`}>
                    {game.blackUsername} (B)
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewGame(game.id)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4"
                    >
                      View Game
                    </Button>
                    <Button 
                      onClick={() => handleCopyPgn(game.pgn, game.id)}
                      isLoading={copyingPgn[game.id]}
                      disabled={copyingPgn[game.id]}
                      className="bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] px-4"
                    >
                      {copyingPgn[game.id] ? 'Copied!' : 'Copy PGN'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No matches found
            </div>
          )}
        </div>
      </div>
      
      }
      
      
      <ToastContainer theme="dark" />
    </div>
  );
};

export default Matches;