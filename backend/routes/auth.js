// authRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = 'JWT_SECRET';
const prisma = new PrismaClient();

const router = express.Router();

const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};


router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
  
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required.' });
    }
  
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          rating: 250,
        },
      });
  
      res.status(201).json({
        message: 'Registration successful.',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          rating: newUser.rating,
        },
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'An error occurred while registering the user.' });
    }
  });



  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email)
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    try {

      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  

      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' } 
      );
  
      res.status(200).json({
        message: 'Login successful.',
        token,
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'An error occurred while logging in.' });
    }
  });

  
export {checkDatabaseConnection}
export default router;
