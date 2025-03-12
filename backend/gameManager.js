import { PrismaClient } from "@prisma/client";
import { Game } from "./game.js";
import { createGameInDatabase, updateGameInDatabase } from "./actions/db.js";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export class GameManager {
  games = [];
  users = [];
  pendingTenPlayer = null;
  redis;

  constructor() {
    this.games = [];
    this.users = [];
    this.pendingTenPlayer = null;
    this.redis = new Redis(process.env.REDIS_URL);

    this.redis.on("connect", () => {
      console.log("[Redis] Connected to Redis server");
    });

    this.redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err);
    });
  }

  async addHandler(ws) {
    console.log("[WebSocket] New connection established");

    ws.on("message", async (data) => {
      const parsedData = JSON.parse(data);
      console.log("[WebSocket] Received message:", parsedData);

      if (parsedData.type === "create_10") {
        console.log("[Game] Handling create_10 request");
        if (this.pendingTenPlayer === null) {
          console.log("[Game] No pending player, setting current player as pending");
          this.pendingTenPlayer = { ...parsedData.user, socket: ws };
        } else {
          console.log("[Game] Found pending player, creating new game");
          let currUser = { ...parsedData.user, socket: ws };
          const game = await createGameInDatabase(this.pendingTenPlayer, currUser);

          if (game) {
            console.log("[Game] Game created in database, initializing new game");
            const newGame = new Game(this.pendingTenPlayer, currUser, game.id);
            this.games.push(newGame);

            console.log("[Redis] Storing game state in Redis");
            await this.redis.set(`game:${game.id}`, JSON.stringify({
              whitePlayer: this.pendingTenPlayer,
              blackPlayer: currUser,
              board: newGame.game.board(),
              whiteTimer: 600,
              blackTimer: 600,
              isStarted: false,
            }));

            let serverTime = Date.now();
            console.log("[Game] Sending game_created_10 to white player");
            this.pendingTenPlayer.socket.send(JSON.stringify({
              type: "game_created_10",
              gameId: game.id,
              color: "white",
              board: newGame.game.board(),
              startTime: serverTime + 5000,
              whiteTime: 600,
              blackTime: 600,
            }));

            console.log("[Game] Sending game_created_10 to black player");
            currUser.socket.send(JSON.stringify({
              type: "game_created_10",
              gameId: game.id,
              color: "black",
              board: newGame.game.board(),
              startTime: serverTime + 5000,
              whiteTime: 600,
              blackTime: 600,
            }));

            console.log("[Game] Resetting pending player");
            this.pendingTenPlayer = null;
          }
        }
      } else if (parsedData.type === "move") {
        console.log("[Game] Handling move request");
        try {
          const game = this.games.find(game => game.id === parsedData.gameId);
          const moveObj = { from: parsedData.from, to: parsedData.to };
          if (parsedData.promotion) {
            moveObj.promotion = parsedData.promotion;
          }
          game.game.move(moveObj);
          game.isStarted = true;
          console.log("[Game] Move executed:", game.game.ascii());

          console.log("[Redis] Updating game state in Redis");
          await this.redis.set(`game:${game.id}`, JSON.stringify({
            whitePlayer: game.white_player,
            blackPlayer: game.black_player,
            board: game.game.board(),
            whiteTimer: parsedData.whiteTimer,
            blackTimer: parsedData.blackTimer,
            isStarted: true,
          }));

          let whitePlayer = game.white_player;
          let blackPlayer = game.black_player;
          let inCheck = game.game.inCheck();
          let isCheckmate = game.game.isCheckmate();
          let isStalemate = game.game.isStalemate();
          let isThreefoldRepetition = game.game.isThreefoldRepetition();

          game.whiteTimer = parsedData.whiteTimer;
          game.blackTimer = parsedData.blackTimer;

          const updateData = {
            type: "update_timer",
            whiteTimer: parsedData.whiteTimer,
            blackTimer: parsedData.blackTimer,
            inCheck,
            isCheckmate,
            isStalemate,
            isThreefoldRepetition,
            turn: game.game.turn(),
            board: game.game.board(),
            move: moveObj
          };

          console.log("[Game] Sending update_timer to white player");
          whitePlayer.socket.send(JSON.stringify(updateData));

          console.log("[Game] Sending update_timer to black player");
          blackPlayer.socket.send(JSON.stringify(updateData));
        } catch (e) {
          console.error("[Game] Invalid move:", e);
        }
      } else if (parsedData.type === "get_game") {
        console.log("[Game] Handling get_game request");
        const userId = parsedData.user.userId;
        try {
          const game = this.games.find(game => game.id === parsedData.user.gameId);
          const currentUsername = userId === game.white_player.userId ? game.white_player.username : game.black_player.username;
          const opponentUsername = userId === game.white_player.userId ? game.black_player.username : game.white_player.username;

          if (game.isStarted) {
            console.log("[Game] Game is already started, updating sockets");
            game.white_player.socket = game.white_player.userId === userId ? ws : game.white_player.socket;
            game.black_player.socket = game.black_player.userId === userId ? ws : game.black_player.socket;

            // Fetch game state from Redis
            console.log("[Redis] Fetching game state from Redis");
            const gameState = await this.redis.get(`game:${game.id}`);
            const { whiteTimer, blackTimer, board } = JSON.parse(gameState);

            console.log("[Game] Sending existing_game to player");
            ws.send(JSON.stringify({
              type: "existing_game",
              gameId: game.id,
              color: game.white_player.userId === userId ? "white" : "black",
              whiteTime: whiteTimer,
              blackTime: blackTimer,
              board,
              startTime: Date.now(),
              pgn: game.game.pgn(),
              currentUsername,
              opponentUsername
            }));
            return;
          }

          const serverTime = Date.now();
          console.log("[Game] Sending fetched_game to player");
          ws.send(JSON.stringify({
            type: "fetched_game",
            gameId: game.id,
            color: game.white_player.userId === userId ? "white" : "black",
            board: game.game.board(),
            startTime: serverTime + 5000,
            whiteTime: 600,
            blackTime: 600,
            currentUsername,
            opponentUsername
          }));
        } catch (e) {
          console.error("[Game] Error fetching game:", e);
        }
      } else if (parsedData.type === "end_game") {
        console.log("[Game] Handling end_game request");
        const { reason } = parsedData;
        const game = this.games.find(game => game.id === parsedData.gameId);
        const whitePlayerSocket = game.white_player.socket;
        const blackPlayerSocket = game.black_player.socket;
        let winnerId = null;
        const userId = parsedData.userId;

        if (reason === "resign") {
          console.log("[Game] Game ended due to resignation");
          winnerId = (userId === game.white_player.userId ? game.black_player.userId : game.white_player.userId);
          const opponentSocket = userId === game.white_player.userId ? blackPlayerSocket : whitePlayerSocket;
          await updateGameInDatabase(parsedData.gameId, winnerId, game.game.pgn());
          opponentSocket.send(JSON.stringify({ type: "end_game", reason: "Opponent resigned" }));
        } else if (reason === "time") {
          console.log("[Game] Game ended due to time");
          if (game.white_player.userId !== userId) {
            winnerId = game.white_player.userId;
            await updateGameInDatabase(parsedData.gameId, winnerId, game.game.pgn());
            whitePlayerSocket.send(JSON.stringify({ type: "end_game", reason: "Time is up for black, redirecting to home page, and you won the game" }));
          } else {
            winnerId = game.black_player.userId;
            await updateGameInDatabase(parsedData.gameId, winnerId, game.game.pgn());
            blackPlayerSocket.send(JSON.stringify({ type: "end_game", reason: "Time is up for white, redirecting to home page and you won the game" }));
          }
        } else if (reason === "stalemate" || reason === "threefold repetition") {
          console.log("[Game] Game ended due to stalemate or threefold repetition");
          // Draw case, no winner
          await updateGameInDatabase(parsedData.gameId, null, game.game.pgn()); // null winnerId for draw
          whitePlayerSocket.send(JSON.stringify({ type: "end_game", reason: reason === "stalemate" ? "Stalemate! The game is a draw." : "Threefold repetition! The game is a draw." }));
          blackPlayerSocket.send(JSON.stringify({ type: "end_game", reason: reason === "stalemate" ? "Stalemate! The game is a draw." : "Threefold repetition! The game is a draw." }));
        }

        // Remove game state from Redis
        console.log("[Redis] Removing game state from Redis");
        await this.redis.del(`game:${parsedData.gameId}`);
      }
    });
  }
}