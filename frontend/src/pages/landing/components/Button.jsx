import React from 'react';
import { motion } from 'framer-motion';



const Button = ({ children, variant = 'primary', className = '', onClick }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition-colors';
  const variants = {
    primary: 'bg-green-500 text-white hover:bg-green-600',
    secondary: 'text-white hover:text-green-400',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

export default Button;