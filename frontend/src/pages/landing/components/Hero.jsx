import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { fadeInLeft, scaleIn } from '../constants/animations.js';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
  return (
    <section className="min-h-screen bg-black pt-20 flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            {...fadeInLeft}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Master the Game of
              <span className="text-green-500"> Chess</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Challenge players worldwide or improve your skills against computer. 
              Play chess anytime, anywhere.
            </p>
            <Button
            onClick={()=>{
                navigate('/home')
            }}
            className="px-8 py-4 text-lg">Play Now</Button>
          </motion.div>
          
          <motion.div
            {...scaleIn}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80"
              alt="Chess pieces"
              className="rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;