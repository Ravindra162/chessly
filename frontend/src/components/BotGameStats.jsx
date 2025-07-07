import React from 'react';

const BotGameStats = ({ games }) => {
  // Filter bot games (games where either whiteId or blackId is null)
  const botGames = games.filter(game => !game.whiteId || !game.blackId);
  
  if (botGames.length === 0) {
    return (
      <div className="bg-[#111] rounded-xl shadow-lg shadow-blue-600/10 p-6">
        <h3 className="text-xl font-bold text-white mb-4">🤖 Bot Games</h3>
        <p className="text-gray-400">No bot games played yet. Try playing against the computer!</p>
      </div>
    );
  }

  const wins = botGames.filter(game => game.winnerId === game.whiteId || game.winnerId === game.blackId).length;
  const losses = botGames.filter(game => game.winnerId && (game.winnerId !== game.whiteId && game.winnerId !== game.blackId)).length;
  const draws = botGames.filter(game => !game.winnerId).length;
  
  const winRate = botGames.length > 0 ? ((wins / botGames.length) * 100).toFixed(1) : 0;

  return (
    <div className="bg-[#111] rounded-xl shadow-lg shadow-blue-600/10 p-6">
      <h3 className="text-xl font-bold text-white mb-4">🤖 Bot Games Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{botGames.length}</div>
          <div className="text-gray-400 text-sm">Total Games</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{wins}</div>
          <div className="text-gray-400 text-sm">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{losses}</div>
          <div className="text-gray-400 text-sm">Losses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{draws}</div>
          <div className="text-gray-400 text-sm">Draws</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-semibold text-white">Win Rate: {winRate}%</div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${winRate}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-gray-400 text-sm">
          Keep practicing against different difficulty levels to improve your game!
        </div>
      </div>
    </div>
  );
};

export default BotGameStats;
