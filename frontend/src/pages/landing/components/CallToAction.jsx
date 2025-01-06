import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import Button from './Button';
import { fadeInUp } from '../constants/animations.js';
import { useNavigate } from 'react-router-dom';

const CallToAction = () => {
    const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-b from-black to-green-900 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          {...fadeInUp}
          viewport={{ once: true }}
          className="text-center"
        >
          <Crown className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Make Your Move?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join thousands of players worldwide and start your chess journey today. 
            Challenge opponents, improve your skills, and become a master.
          </p>
          <Button onClick={()=>{
            navigate('/home')
          }} className="px-8 py-4 text-lg">Play Now</Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;