import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Monitor, Users } from 'lucide-react';

const features = [
  {
    icon: <Clock className="w-12 h-12 text-green-500" />,
    title: '10-Minute Games',
    description: 'Quick, intense matches with a 10-minute time limit per player.'
  },
  {
    icon: <Users className="w-12 h-12 text-green-500" />,
    title: 'Play Online',
    description: 'Challenge random players from around the world.'
  },
  {
    icon: <Monitor className="w-12 h-12 text-green-500" />,
    title: 'Computer Opponent',
    description: 'Practice and improve against computer opponent.'
  }
];

const Features = () => {
  return (
    <section className="bg-black/95 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Game Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience chess like never before with our cutting-edge features designed for both casual players and professionals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-black/50 p-8 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;