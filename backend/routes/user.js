import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = 'JWT_SECRET'; // Replace with a more secure secret in production

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("Auth error")
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
        whiteId: true,
        blackId: true,
      },
    });

    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    // Get current time and add 5 seconds (5000 milliseconds) for baseline
    const baselineTime = Date.now() + 20000; // Current time + 5 seconds

    res.status(200).json({
      ...game,
      baselineTime, // Include the baseline time in the response
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ msg: 'An error occurred while fetching game data.' });
  }
});

router.post('/game/update/winnerId',authMiddleware, async (req, res) => {

  const {gameId, winnerId, pgn} = req.body;

  console.log(pgn)

  // find game by gameId and update winnerId
  try {
    const game = await prisma.games.update({
      where: { id: gameId },
      data: {
        winnerId,
        pgn
      },
    });

    res.status(200).json({ msg: 'You Won this match' });
  } catch (error) {
    console.error('Error updating winner:', error);
    res.status(500).json({ msg: 'An error occurred while updating the winner.' });
  }

})

// router.get("/games",authMiddleware, async (req, res) => {
//   const userId = req.user;
//   console.log("Get")
//   console.log(userId)
//   try {
//     const games = await prisma.games.findMany({
//       where: {
//         OR: [
//           { whiteId: userId },
//           { blackId: userId },
//         ],
//       },
//       select: {
//         id: true,
//         winnerId: true,
//         pgn: true,
//         whiteId: true,
//         blackId: true,
//       },
//     });

//     res.status(200).json({ games });
//   } catch (error) {
//     console.error('Error fetching games:', error);
//     res.status(500).json({ msg: 'An error occurred while fetching game data.' });
//   }
// });
router.get("/games/", authMiddleware, async (req, res) => {
  const userId = req.user;

  try {
    const games = await prisma.games.findMany({
      where: {
        OR: [
          { whiteId: userId },
          { blackId: userId },
        ],
      },
      select: {
        id: true,
        winnerId: true,
        pgn: true,
        white: {
          select: {
            username: true,
          },
        },
        black: {
          select: {
            username: true,
          },
        },
      },
    });

    let aggregatedData = games.map(game => ({
      id: game.id,
      winnerId: game.winnerId,
      pgn: game.pgn,
      whiteUsername: game.white.username,
      blackUsername: game.black.username,
    }));
    // reverse aggregated data
    aggregatedData = aggregatedData.reverse();
    // console.log(aggregatedData)

    res.status(200).json({ games: aggregatedData });
  } catch (error) {
    console.error('Error fetching aggregated game data:', error);
    res.status(500).json({ msg: 'An error occurred while fetching aggregated game data.' });
  }
});

// Get a specific game by ID
router.get("/games/:gameId", authMiddleware, async (req, res) => {
  const userId = req.user;
  const { gameId } = req.params;

  try {
    const game = await prisma.games.findFirst({
      where: {
        id: gameId,
        OR: [
          { whiteId: userId },
          { blackId: userId },
        ],
      },
      select: {
        id: true,
        winnerId: true,
        pgn: true,
        Time: true,
        white: {
          select: {
            username: true,
          },
        },
        black: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ msg: 'Game not found or access denied.' });
    }

    const gameData = {
      id: game.id,
      winnerId: game.winnerId,
      pgn: game.pgn,
      createdAt: game.Time,
      whiteUsername: game.white.username,
      blackUsername: game.black.username,
    };

    res.status(200).json({ game: gameData });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ msg: 'An error occurred while fetching the game.' });
  }
});

export default router;
