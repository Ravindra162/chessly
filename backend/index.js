import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { GameManager } from './gameManager.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import friendsRoutes from './routes/friends.js';
import { checkDatabaseConnection } from './routes/auth.js';
const app = express();
const port = process.env.PORT || 5000
app.use(cors({
  origin: '*',
}));
app.use(express.json());
const server = createServer(app);
const wss = new WebSocketServer({ server });

checkDatabaseConnection()

app.use("/auth", authRoutes);
app.use("/user",userRoutes);
app.use("/friends", friendsRoutes);


app.get("/health",(req,res)=>{
  res.json({
    msg:"Chess backend is healthy"
  })
})


const gameManager = new GameManager();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  gameManager.addHandler(ws)


  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});



server.listen(port, () => {
  console.log('Server is running on port '+port);
});
