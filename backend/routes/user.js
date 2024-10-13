import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = 'JWT_SECRET'; // Replace with a more secure secret in production

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Route to get user details
router.get('/user', authMiddleware, async (req, res) => {
  const id = req.user;

  try {
    const user = await prisma.user.findFirst({
      where: { id },
      select: {
        id:true,
        email: true,
        username: true,
        rating: true,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ msg: 'An error occurred while fetching user details.' });
  }
});

router.get('/game/:gameId', authMiddleware, async (req, res) => {
  const gameId = req.params.gameId;
  console.log("Game ID:", gameId);

  try {
    const game = await prisma.games.findFirst({
      where: { id: gameId },
      select: {
        board: true,
        time_remaining_white: true,
        time_remaining_black: true,
        whiteId:true,
        blackId:true
      },
    });

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ msg: 'An error occurred while fetching game data.' });
  }
});


export default router;
