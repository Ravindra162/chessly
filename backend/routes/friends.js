import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Initialize Prisma with better error handling for production
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const router = express.Router();
const JWT_SECRET = 'JWT_SECRET'; // Should match your auth routes

// Ensure Prisma connection with better error handling
(async () => {
  try {
    await prisma.$connect();
    console.log('Prisma client connected successfully in friends.js');
  } catch (error) {
    console.error('Failed to connect Prisma client in friends.js:', error);
    console.error('Database URL exists:', !!process.env.DATABASE_URL);
    process.exit(1); // Exit if database connection fails
  }
})();

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

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

// Send a friend request
router.post('/friend-request/send', authMiddleware, async (req, res) => {
  const senderId = req.user;
  const { receiverUsername } = req.body;

  try {
    // Find the receiver by username
    const receiver = await prisma.user.findFirst({
      where: { username: receiverUsername }
    });

    if (!receiver) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ msg: 'Cannot send friend request to yourself' });
    }

    // Check if there's already a friend request between these users
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({ msg: 'Friend request already exists' });
    }

    // Check if they're already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiver.id },
          { user1Id: receiver.id, user2Id: senderId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ msg: 'Already friends' });
    }

    // Create the friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'pending'
      },
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } }
      }
    });

    res.status(201).json({ 
      msg: 'Friend request sent successfully',
      friendRequest: {
        id: friendRequest.id,
        senderUsername: friendRequest.sender.username,
        receiverUsername: friendRequest.receiver.username,
        status: friendRequest.status,
        createdAt: friendRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ msg: 'An error occurred while sending friend request' });
  }
});

// Get pending friend requests (received)
router.get('/friend-requests/received', authMiddleware, async (req, res) => {
  const userId = req.user;

  try {
    // Debug logging
    console.log('Attempting to fetch friend requests for user:', userId);
    console.log('Prisma client status:', !!prisma);
    console.log('FriendRequest model:', !!prisma?.friendRequest);
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    
    if (!prisma) {
      throw new Error('Prisma client not available');
    }
    
    if (!prisma.friendRequest) {
      throw new Error('FriendRequest model not available on Prisma client');
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'pending'
      },
      include: {
        sender: { select: { username: true, rating: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRequests = friendRequests.map(request => ({
      id: request.id,
      senderUsername: request.sender.username,
      senderRating: request.sender.rating,
      createdAt: request.createdAt
    }));

    res.status(200).json({ friendRequests: formattedRequests });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ msg: 'An error occurred while fetching friend requests' });
  }
});

// Get sent friend requests
router.get('/friend-requests/sent', authMiddleware, async (req, res) => {
  const userId = req.user;

  try {
    // Debug logging
    console.log('Attempting to fetch sent requests for user:', userId);
    
    if (!prisma || !prisma.friendRequest) {
      throw new Error('Prisma client or FriendRequest model not available');
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'pending'
      },
      include: {
        receiver: { select: { username: true, rating: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRequests = friendRequests.map(request => ({
      id: request.id,
      receiverUsername: request.receiver.username,
      receiverRating: request.receiver.rating,
      createdAt: request.createdAt
    }));

    res.status(200).json({ friendRequests: formattedRequests });
  } catch (error) {
    console.error('Error fetching sent friend requests:', error);
    res.status(500).json({ msg: 'An error occurred while fetching sent friend requests' });
  }
});

// Accept a friend request
router.post('/friend-request/accept', authMiddleware, async (req, res) => {
  const userId = req.user;
  const { requestId } = req.body;

  try {
    // Find the friend request
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ msg: 'Friend request not found' });
    }

    // Use a transaction to update the request and create friendship
    await prisma.$transaction(async (tx) => {
      // Update the friend request status
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' }
      });

      // Create the friendship (always put smaller ID first for consistency)
      const user1Id = Math.min(friendRequest.senderId, friendRequest.receiverId);
      const user2Id = Math.max(friendRequest.senderId, friendRequest.receiverId);

      await tx.friendship.create({
        data: {
          user1Id,
          user2Id
        }
      });
    });

    res.status(200).json({ msg: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ msg: 'An error occurred while accepting friend request' });
  }
});

// Reject a friend request
router.post('/friend-request/reject', authMiddleware, async (req, res) => {
  const userId = req.user;
  const { requestId } = req.body;

  try {
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ msg: 'Friend request not found' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' }
    });

    res.status(200).json({ msg: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ msg: 'An error occurred while rejecting friend request' });
  }
});

// Get friends list
router.get('/friends', authMiddleware, async (req, res) => {
  const userId = req.user;

  try {
    // Debug logging
    console.log('Attempting to fetch friends for user:', userId);
    
    if (!prisma || !prisma.friendship) {
      throw new Error('Prisma client or Friendship model not available');
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: { select: { id: true, username: true, rating: true } },
        user2: { select: { id: true, username: true, rating: true } }
      }
    });

    const friends = friendships.map(friendship => {
      const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1;
      return {
        id: friend.id,
        username: friend.username,
        rating: friend.rating,
        friendshipCreatedAt: friendship.createdAt
      };
    });

    res.status(200).json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ msg: 'An error occurred while fetching friends' });
  }
});

// Remove a friend
router.delete('/friend/remove', authMiddleware, async (req, res) => {
  const userId = req.user;
  const { friendId } = req.body;

  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId }
        ]
      }
    });

    if (!friendship) {
      return res.status(404).json({ msg: 'Friendship not found' });
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    res.status(200).json({ msg: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ msg: 'An error occurred while removing friend' });
  }
});

// Search users by username (for sending friend requests)
router.get('/search', authMiddleware, async (req, res) => {
  const { username } = req.query;
  const userId = req.user;

  if (!username) {
    return res.status(400).json({ msg: 'Username query parameter is required' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive'
        },
        NOT: { id: userId } // Exclude current user
      },
      select: {
        id: true,
        username: true,
        rating: true
      },
      take: 10 // Limit results
    });

    // Check which users are already friends or have pending requests
    const userIds = users.map(user => user.id);
    
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: { in: userIds } },
          { user1Id: { in: userIds }, user2Id: userId }
        ]
      }
    });

    const existingRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: userIds }, status: 'pending' },
          { senderId: { in: userIds }, receiverId: userId, status: 'pending' }
        ]
      }
    });

    const friendIds = new Set();
    existingFriendships.forEach(friendship => {
      const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id;
      friendIds.add(friendId);
    });

    const pendingRequestIds = new Set();
    existingRequests.forEach(request => {
      if (request.senderId === userId) {
        pendingRequestIds.add(request.receiverId);
      } else {
        pendingRequestIds.add(request.senderId);
      }
    });

    const usersWithStatus = users.map(user => ({
      ...user,
      isFriend: friendIds.has(user.id),
      hasPendingRequest: pendingRequestIds.has(user.id)
    }));

    res.status(200).json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ msg: 'An error occurred while searching users' });
  }
});

// Challenge a friend to a game (WebSocket-based)
router.post('/challenge', authMiddleware, async (req, res) => {
  const challengerId = req.user;
  const { friendId } = req.body;

  try {
    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: challengerId, user2Id: friendId },
          { user1Id: friendId, user2Id: challengerId }
        ]
      }
    });

    if (!friendship) {
      return res.status(400).json({ msg: 'You can only challenge friends' });
    }

    // Get friend's details
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, username: true }
    });

    if (!friend) {
      return res.status(404).json({ msg: 'Friend not found' });
    }

    // Return success - the actual challenge will be handled via WebSocket
    res.status(200).json({
      msg: 'Ready to send challenge',
      friend: {
        id: friend.id,
        username: friend.username
      }
    });
  } catch (error) {
    console.error('Error preparing challenge:', error);
    res.status(500).json({ msg: 'An error occurred while preparing the challenge' });
  }
});

// Check if a friend is online
router.get('/friend/online/:friendId', authMiddleware, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user;

  try {
    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: parseInt(friendId) },
          { user1Id: parseInt(friendId), user2Id: userId }
        ]
      }
    });

    if (!friendship) {
      return res.status(400).json({ msg: 'You can only check friends status' });
    }

    // This would be checked via GameManager in a real implementation
    // For now, we'll return a placeholder
    res.status(200).json({
      online: false, // This should be checked via GameManager
      msg: 'Friend status check completed'
    });
  } catch (error) {
    console.error('Error checking friend status:', error);
    res.status(500).json({ msg: 'An error occurred while checking friend status' });
  }
});

export default router;
