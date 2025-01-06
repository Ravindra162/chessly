import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed w-full bg-black/90 backdrop-blur-sm z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Logo />
        <div className="flex space-x-4">
          <Button
          onClick={() => navigate('/login')}
          variant="secondary">Login</Button>
          <Button
          onClick={() => navigate('/register')}
          variant="primary">Register Now</Button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;