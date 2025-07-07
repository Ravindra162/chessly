import express from 'express';
import { ChessBot } from '../chessBot.js';

const router = express.Router();

// Get available bot difficulties
router.get('/difficulties', (req, res) => {
  try {
    const difficulties = [
      {
        value: 'easy',
        label: 'Easy',
        description: ChessBot.getDifficultyDescription('easy'),
        rating: ChessBot.getDifficultyRating('easy')
      },
      {
        value: 'medium',
        label: 'Medium', 
        description: ChessBot.getDifficultyDescription('medium'),
        rating: ChessBot.getDifficultyRating('medium')
      },
      {
        value: 'hard',
        label: 'Hard',
        description: ChessBot.getDifficultyDescription('hard'),
        rating: ChessBot.getDifficultyRating('hard')
      },
      {
        value: 'expert',
        label: 'Expert',
        description: ChessBot.getDifficultyDescription('expert'),
        rating: ChessBot.getDifficultyRating('expert')
      }
    ];

    res.status(200).json({ difficulties });
  } catch (error) {
    console.error('Error fetching bot difficulties:', error);
    res.status(500).json({ error: 'Failed to fetch bot difficulties' });
  }
});

export default router;
