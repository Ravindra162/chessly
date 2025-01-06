import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const Logo = () => {
  return (
    <motion.div 
      className="flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
    >
      <Crown className="w-8 h-8 text-green-500" />
      <span className="text-2xl font-bold text-white">ChessVerse</span>
    </motion.div>
  );
};

export default Logo;