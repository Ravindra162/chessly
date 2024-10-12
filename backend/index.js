import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { GameManager } from './gameManager.js';
const app = express();
app.use(cors({
  origin: '*',
}));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const gameManager = new GameManager();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  gameManager.addUser(ws)


  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});



server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
