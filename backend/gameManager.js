import { PrismaClient } from "@prisma/client";
import { Game } from "./game.js";
import { createGameInDatabase, updateGameInDatabase } from "./actions/db.js";
import { ChessBot } from "./chessBot.js";
import { Chess } from "chess.js";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export class GameManager {
  games = [];
  users = [];
  onlineUsers = new Map(); // Map of userId -> {socket, username, rating}
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

    // Handle WebSocket close/disconnect events
    ws.on("close", () => {
      console.log("[WebSocket] Connection closed, cleaning up pending players");
      this.cleanupDisconnectedPlayer(ws);
      this.removeOnlineUser(ws);
    });

    ws.on("error", (error) => {
      console.log("[WebSocket] Connection error:", error);
      this.cleanupDisconnectedPlayer(ws);
      this.removeOnlineUser(ws);
    });

    ws.on("message", async (data) => {
      const parsedData = JSON.parse(data);
      console.log("[WebSocket] Received message:", parsedData);

      // Handle user login/connection
      if (parsedData.type === "user_connected") {
        console.log("[User] User connected:", parsedData.user.userId);
        this.addOnlineUser(parsedData.user.userId, ws, parsedData.user.username, parsedData.user.rating);
        return;
      }

      // Handle friend challenge
      if (parsedData.type === "friend_challenge") {
        console.log("[Challenge] Handling friend challenge");
        await this.handleFriendChallenge(ws, parsedData);
        return;
      }

      // Handle challenge response
      if (parsedData.type === "challenge_response") {
        console.log("[Challenge] Handling challenge response");
        await this.handleChallengeResponse(ws, parsedData);
        return;
      }

      if (parsedData.type === "create_10") {
        console.log("[Game] Handling create_10 request for user:", parsedData.user.userId);
        console.log("[Game] Current pendingTenPlayer state:", this.pendingTenPlayer ? "exists" : "null");
        
        // Check current game state for this user
        const userGameState = await this.isUserInGame(parsedData.user.userId);
        
        if (userGameState.state === 'pending') {
          console.log("[Game] User is already pending, updating socket connection");
          if (this.pendingTenPlayer && this.pendingTenPlayer.userId === parsedData.user.userId) {
            this.pendingTenPlayer.socket = ws; // Update socket in case of reconnection
          }
          return;
        }
        
        if (userGameState.state === 'active') {
          console.log("[Game] User is already in an active game, redirecting to game");
          // Send them back to their existing game
          ws.send(JSON.stringify({
            type: "redirect_to_game",
            gameId: userGameState.data.id,
            message: "You are already in an active game"
          }));
          return;
        }
        
        if (this.pendingTenPlayer === null) {
          console.log("[Game] No pending player, setting current player as pending");
          this.pendingTenPlayer = { ...parsedData.user, socket: ws };
          console.log("[Game] Set pendingTenPlayer to:", this.pendingTenPlayer.userId);
        } else {
          console.log("[Game] Found pending player:", this.pendingTenPlayer.userId);
          // Double-check to ensure we're not matching the same user (extra safety)
          if (this.pendingTenPlayer.userId === parsedData.user.userId) {
            console.log("[Game] Attempted self-match detected, this should not happen");
            return;
          }
          
          // Additional safety check before proceeding
          if (!this.pendingTenPlayer || !this.pendingTenPlayer.socket) {
            console.error("[Game] Error: pendingTenPlayer became null or lost socket before game creation");
            this.pendingTenPlayer = null;
            return;
          }
          
          console.log("[Game] Found pending player, creating new game between:", 
            this.pendingTenPlayer.userId, "and", parsedData.user.userId);
          let currUser = { ...parsedData.user, socket: ws };
          const game = await createGameInDatabase(this.pendingTenPlayer.userId, currUser.userId);

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
            
            // Safety check to ensure pendingTenPlayer still exists
            if (this.pendingTenPlayer && this.pendingTenPlayer.socket) {
              this.pendingTenPlayer.socket.send(JSON.stringify({
                type: "game_created_10",
                gameId: game.id,
                color: "white",
                board: newGame.game.board(),
                startTime: serverTime + 5000,
                whiteTime: 600,
                blackTime: 600,
              }));
            } else {
              console.error("[Game] Error: pendingTenPlayer is null or has no socket when trying to send game_created_10");
              return;
            }

            console.log("[Game] Sending game_created_10 to black player");
            if (currUser && currUser.socket) {
              currUser.socket.send(JSON.stringify({
                type: "game_created_10",
                gameId: game.id,
                color: "black",
                board: newGame.game.board(),
                startTime: serverTime + 5000,
                whiteTime: 600,
                blackTime: 600,
              }));
            } else {
              console.error("[Game] Error: currUser is null or has no socket when trying to send game_created_10");
              return;
            }

            console.log("[Game] Resetting pending player");
            this.pendingTenPlayer = null;
          }
        }
      } else if (parsedData.type === "start_10") {
        // Legacy support for old message format - redirect to create_10 logic
        console.log("[Game] Handling legacy start_10 request, converting to create_10");
        parsedData.type = "create_10";
        parsedData.user = {
          userId: parsedData.userId,
          username: "Legacy User" // We don't have username in old format
        };
        // Continue to create_10 logic by falling through...
      }
      
      if (parsedData.type === "create_10") {
        console.log(`[Game] Handling create_10 request for user: ${parsedData.user.userId}`);
        
        // Check if user is already in a game or pending
        if (this.isUserInGame(parsedData.user.userId)) {
          console.log(`[Game] User ${parsedData.user.userId} is already in a game or pending`);
          return;
        }

        if (this.pendingPlayer && this.pendingPlayer.userId !== parsedData.user.userId) {
          console.log("[Game] Found pending player, creating game");
          // Pair with waiting player
          const gameId = Math.random().toString(36).substring(2, 15);
          const game = new Chess();
          
          // Randomly assign colors
          const randomColor = Math.random() > 0.5;
          const whitePlayer = randomColor ? this.pendingPlayer : { socket: ws, userId: parsedData.user.userId, username: parsedData.user.username };
          const blackPlayer = randomColor ? { socket: ws, userId: parsedData.user.userId, username: parsedData.user.username } : this.pendingPlayer;

          this.games.push({
            id: gameId,
            white_player: whitePlayer,
            black_player: blackPlayer,
            game: game,
            whiteTimer: 600,
            blackTimer: 600,
            isStarted: false,
          });

          const startTime = Date.now() + 10000; // 10 seconds from now

          // Send game created message to both players
          whitePlayer.socket.send(JSON.stringify({
            type: "game_created_10",
            gameId,
            color: "white",
            board: game.board(),
            startTime,
          }));

          blackPlayer.socket.send(JSON.stringify({
            type: "game_created_10",
            gameId,
            color: "black",
            board: game.board(),
            startTime,
          }));

          console.log(`[Game] Game ${gameId} created with players ${whitePlayer.userId} (white) and ${blackPlayer.userId} (black)`);
          this.pendingPlayer = null;
        } else {
          console.log("[Game] No pending player, setting current player as pending");
          this.pendingPlayer = { socket: ws, userId: parsedData.user.userId, username: parsedData.user.username };
        }
      } else if (parsedData.type === "move") {
        console.log("[Game] Handling move request");
        try {
          const game = this.games.find(game => game.id === parsedData.gameId);
          if (!game) {
            console.error("[Game] Game not found:", parsedData.gameId);
            return;
          }

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

          // Helper function to safely send updates
          const safeSendUpdate = (player, playerColor) => {
            try {
              if (player && player.socket && player.socket.readyState === player.socket.OPEN) {
                console.log(`[Game] Sending update_timer to ${playerColor} player`);
                player.socket.send(JSON.stringify(updateData));
                return true;
              } else {
                console.log(`[Game] Warning: ${playerColor} player socket not available`);
                return false;
              }
            } catch (error) {
              console.error(`[Game] Error sending update to ${playerColor} player:`, error);
              return false;
            }
          };

          const whiteSent = safeSendUpdate(whitePlayer, 'white');
          const blackSent = safeSendUpdate(blackPlayer, 'black');

          // If both players couldn't receive the update, there might be a serious issue
          if (!whiteSent && !blackSent) {
            console.error("[Game] Critical: Neither player could receive game update");
          }

          // If this is a bot game and it's now the bot's turn, make bot move
          if (game.isBot && !game.game.isGameOver()) {
            const currentTurn = game.game.turn();
            if (currentTurn === game.botColor.charAt(0)) {
              console.log("[Bot Game] Triggering bot move after human move");
              setTimeout(() => {
                this.makeBotMove(game.id);
              }, 500); // Small delay for better UX
            }
          }

        } catch (e) {
          console.error("[Game] Invalid move:", e);
          // Send error back to the player who made the invalid move
          try {
            ws.send(JSON.stringify({
              type: "move_error",
              error: "Invalid move",
              details: e.message
            }));
          } catch (sendError) {
            console.error("[Game] Could not send move error to player:", sendError);
          }
        }
      } else if (parsedData.type === "get_game") {
        console.log("[Game] Handling get_game request");
        const userId = parsedData.user.userId;
        try {
          const game = this.games.find(game => game.id === parsedData.user.gameId);
          
          if (!game) {
            console.error("[Game] Game not found for get_game request:", parsedData.user.gameId);
            ws.send(JSON.stringify({
              type: "game_error",
              error: "Game not found"
            }));
            return;
          }
          
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
        try {
          const { reason } = parsedData;
          const game = this.games.find(game => game.id === parsedData.gameId);
          
          if (!game) {
            console.error("[Game] Game not found for end_game request:", parsedData.gameId);
            return;
          }

          const whitePlayerSocket = game.white_player?.socket;
          const blackPlayerSocket = game.black_player?.socket;
          let winnerId = null;
          const userId = parsedData.userId;

          // Helper function to safely send messages
          const safeSend = (socket, message) => {
            try {
              if (socket && socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify(message));
                return true;
              }
              return false;
            } catch (error) {
              console.error("[Game] Error sending message to socket:", error);
              return false;
            }
          };

          if (reason === "resign") {
            console.log("[Game] Game ended due to resignation");
            winnerId = (userId === game.white_player.userId ? game.black_player.userId : game.white_player.userId);
            const opponentSocket = userId === game.white_player.userId ? blackPlayerSocket : whitePlayerSocket;
            
            await updateGameInDatabase(parsedData.gameId, winnerId, parsedData.pgn || game.game.pgn());
            
            const notificationSent = safeSend(opponentSocket, { 
              type: "end_game", 
              reason: "Opponent resigned",
              winner: userId === game.white_player.userId ? 'black' : 'white'
            });
            
            if (!notificationSent) {
              console.log("[Game] Could not notify opponent of resignation (disconnected)");
            }
            
          } else if (reason === "time") {
            console.log("[Game] Game ended due to time");
            if (game.white_player.userId !== userId) {
              winnerId = game.white_player.userId;
              await updateGameInDatabase(parsedData.gameId, winnerId, parsedData.pgn || game.game.pgn());
              safeSend(whitePlayerSocket, { 
                type: "end_game", 
                reason: "Time is up for black, you won the game!",
                winner: 'white'
              });
            } else {
              winnerId = game.black_player.userId;
              await updateGameInDatabase(parsedData.gameId, winnerId, parsedData.pgn || game.game.pgn());
              safeSend(blackPlayerSocket, { 
                type: "end_game", 
                reason: "Time is up for white, you won the game!",
                winner: 'black'
              });
            }
            
          } else if (reason === "stalemate" || reason === "threefold repetition") {
            console.log("[Game] Game ended due to stalemate or threefold repetition");
            // Draw case, no winner
            await updateGameInDatabase(parsedData.gameId, null, parsedData.pgn || game.game.pgn());
            
            const drawMessage = {
              type: "end_game", 
              reason: reason === "stalemate" ? "Stalemate! The game is a draw." : "Threefold repetition! The game is a draw.",
              result: 'draw'
            };
            
            safeSend(whitePlayerSocket, drawMessage);
            safeSend(blackPlayerSocket, drawMessage);
          }

          // Remove game from active games list
          const gameIndex = this.games.findIndex(g => g.id === parsedData.gameId);
          if (gameIndex !== -1) {
            this.games.splice(gameIndex, 1);
            console.log("[Game] Removed game from active games list");
          }

          // Remove game state from Redis
          console.log("[Redis] Removing game state from Redis");
          await this.redis.del(`game:${parsedData.gameId}`);
          
        } catch (error) {
          console.error("[Game] Error handling end_game request:", error);
        }
      } else if (parsedData.type === "create_bot_game") {
        console.log("[Game] Handling create_bot_game request for user:", parsedData.user.userId);
        await this.createBotGame(ws, parsedData);
      }
    });
  }

  // Method to check if a user is already in any game state
  isUserInGame(userId) {
    // Check if user is pending
    if (this.pendingTenPlayer && this.pendingTenPlayer.userId === userId) {
      return { state: 'pending', data: this.pendingTenPlayer };
    }

    // Check if user is in active game
    const activeGame = this.games.find(game => 
      game.white_player.userId === userId || 
      game.black_player.userId === userId
    );

    if (activeGame) {
      return { state: 'active', data: activeGame };
    }

    return { state: 'none', data: null };
  }

  // Add online user
  addOnlineUser(userId, socket, username, rating) {
    this.onlineUsers.set(userId, { socket, username, rating });
    console.log(`[User] User ${username} (${userId}) is now online`);
  }

  // Remove online user
  removeOnlineUser(socket) {
    for (const [userId, userData] of this.onlineUsers.entries()) {
      if (userData.socket === socket) {
        console.log(`[User] User ${userData.username} (${userId}) is now offline`);
        this.onlineUsers.delete(userId);
        break;
      }
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Get online user data
  getOnlineUser(userId) {
    return this.onlineUsers.get(userId);
  }

  // Handle friend challenge
  async handleFriendChallenge(ws, parsedData) {
    const { challengerId, friendId, timeControl = 600, challengerUsername } = parsedData;

    try {
      // Check if friend is online
      if (!this.isUserOnline(friendId)) {
        ws.send(JSON.stringify({
          type: "challenge_error",
          error: "Friend is not online"
        }));
        return;
      }

      // Verify friendship exists in database
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: challengerId, user2Id: friendId },
            { user1Id: friendId, user2Id: challengerId }
          ]
        }
      });

      if (!friendship) {
        ws.send(JSON.stringify({
          type: "challenge_error",
          error: "You can only challenge friends"
        }));
        return;
      }

      // Get friend's socket
      const friendData = this.getOnlineUser(friendId);
      if (!friendData) {
        ws.send(JSON.stringify({
          type: "challenge_error",
          error: "Friend is not online"
        }));
        return;
      }

      // Send challenge to friend
      friendData.socket.send(JSON.stringify({
        type: "friend_challenge_received",
        challengerId,
        challengerUsername,
        timeControl,
        challengeId: `${challengerId}_${friendId}_${Date.now()}` // Temporary ID
      }));

      // Confirm challenge sent
      ws.send(JSON.stringify({
        type: "challenge_sent",
        message: `Challenge sent to ${friendData.username}`
      }));

    } catch (error) {
      console.error("[Challenge] Error handling friend challenge:", error);
      ws.send(JSON.stringify({
        type: "challenge_error",
        error: "Failed to send challenge"
      }));
    }
  }

  // Handle challenge response
  async handleChallengeResponse(ws, parsedData) {
    const { challengerId, challengedId, accepted, challengeId } = parsedData;

    try {
      if (!accepted) {
        // Challenge rejected
        const challengerData = this.getOnlineUser(challengerId);
        if (challengerData) {
          challengerData.socket.send(JSON.stringify({
            type: "challenge_rejected",
            message: "Your challenge was declined"
          }));
        }
        return;
      }

      // Challenge accepted - create game
      const challengerData = this.getOnlineUser(challengerId);
      const challengedData = this.getOnlineUser(challengedId);

      if (!challengerData || !challengedData) {
        ws.send(JSON.stringify({
          type: "challenge_error",
          error: "One of the players is no longer online"
        }));
        return;
      }

      // Create a new game with random color assignment
      const isWhite = Math.random() < 0.5;
      const whiteId = isWhite ? challengerId : challengedId;
      const blackId = isWhite ? challengedId : challengerId;

      const game = await createGameInDatabase(whiteId, blackId);

      if (game) {
        // Create game instance
        const newGame = new Game(
          { userId: whiteId, username: isWhite ? challengerData.username : challengedData.username, socket: isWhite ? challengerData.socket : challengedData.socket },
          { userId: blackId, username: isWhite ? challengedData.username : challengerData.username, socket: isWhite ? challengedData.socket : challengerData.socket },
          game.id
        );
        this.games.push(newGame);

        // Store game state in Redis
        await this.redis.set(`game:${game.id}`, JSON.stringify({
          whitePlayer: { userId: whiteId, username: isWhite ? challengerData.username : challengedData.username },
          blackPlayer: { userId: blackId, username: isWhite ? challengedData.username : challengerData.username },
          board: newGame.game.board(),
          whiteTimer: 600,
          blackTimer: 600,
          isStarted: false,
        }));

        const serverTime = Date.now();

        // Send game created to both players
        challengerData.socket.send(JSON.stringify({
          type: "game_created_10",
          gameId: game.id,
          color: isWhite ? "white" : "black",
          board: newGame.game.board(),
          startTime: serverTime + 5000,
          whiteTime: 600,
          blackTime: 600,
        }));

        challengedData.socket.send(JSON.stringify({
          type: "game_created_10",
          gameId: game.id,
          color: isWhite ? "black" : "white",
          board: newGame.game.board(),
          startTime: serverTime + 5000,
          whiteTime: 600,
          blackTime: 600,
        }));

        console.log(`[Game] Friend challenge game created: ${game.id}`);
      }

    } catch (error) {
      console.error("[Challenge] Error handling challenge response:", error);
      ws.send(JSON.stringify({
        type: "challenge_error",
        error: "Failed to process challenge response"
      }));
    }
  }

  // Cleanup method to remove disconnected players from pending queue
  cleanupDisconnectedPlayer(disconnectedSocket) {
    try {
      // Check if the disconnected socket belongs to the pending player
      if (this.pendingTenPlayer && this.pendingTenPlayer.socket === disconnectedSocket) {
        console.log("[Game] Removing disconnected player from pending queue:", this.pendingTenPlayer.userId);
        this.pendingTenPlayer = null;
      }

      // Also check if the disconnected player is in any active game
      this.games.forEach((game, index) => {
        if (!game || !game.white_player || !game.black_player) {
          console.log("[Game] Warning: Game object is corrupted, removing from games array");
          this.games.splice(index, 1);
          return;
        }

        const whiteDisconnected = game.white_player.socket === disconnectedSocket;
        const blackDisconnected = game.black_player.socket === disconnectedSocket;

        if (whiteDisconnected || blackDisconnected) {
          const disconnectedPlayer = whiteDisconnected ? 'white' : 'black';
          console.log(`[Game] ${disconnectedPlayer} player disconnected from game:`, game.id);
          
          // Mark the player as disconnected but keep the game for potential reconnection
          if (whiteDisconnected) {
            game.white_player.disconnected = true;
            game.white_player.disconnectedAt = Date.now();
          } else {
            game.black_player.disconnected = true;
            game.black_player.disconnectedAt = Date.now();
          }

          // Set a timeout to end the game if player doesn't reconnect within 30 seconds
          setTimeout(() => {
            this.handlePlayerDisconnectionTimeout(game.id, disconnectedPlayer);
          }, 30000);
        }
      });
    } catch (error) {
      console.error("[Game] Error in cleanupDisconnectedPlayer:", error);
    }
  }

  // Handle player disconnection timeout
  async handlePlayerDisconnectionTimeout(gameId, disconnectedPlayer) {
    try {
      const game = this.games.find(g => g.id === gameId);
      if (!game) return;

      const disconnectedPlayerObj = disconnectedPlayer === 'white' ? game.white_player : game.black_player;
      const connectedPlayerObj = disconnectedPlayer === 'white' ? game.black_player : game.white_player;

      // Check if player is still disconnected
      if (disconnectedPlayerObj.disconnected) {
        console.log(`[Game] ${disconnectedPlayer} player didn't reconnect to game ${gameId}, ending game`);
        
        // Notify the connected player about the disconnection
        if (connectedPlayerObj && connectedPlayerObj.socket && !connectedPlayerObj.disconnected) {
          connectedPlayerObj.socket.send(JSON.stringify({
            type: "end_game",
            reason: `${disconnectedPlayer === 'white' ? 'White' : 'Black'} player disconnected. You win!`,
            winner: disconnectedPlayer === 'white' ? 'black' : 'white'
          }));
        }

        // Update game in database as completed
        await this.updateGameInDatabase(gameId, {
          status: 'completed',
          winner: disconnectedPlayer === 'white' ? game.black_player.userId : game.white_player.userId,
          endReason: 'disconnection',
          pgn: game.game.pgn()
        });

        // Remove game from active games
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
          this.games.splice(gameIndex, 1);
        }
      }
    } catch (error) {
      console.error("[Game] Error handling disconnection timeout:", error);
    }
  }

  // Update game in database
  async updateGameInDatabase(gameId, updateData) {
    try {
      // Update in Redis
      const gameData = await this.redis.get(`game:${gameId}`);
      if (gameData) {
        const parsedGame = JSON.parse(gameData);
        Object.assign(parsedGame, updateData);
        await this.redis.set(`game:${gameId}`, JSON.stringify(parsedGame));
      }

      // Here you would also update your primary database if you have one
      console.log(`[Game] Updated game ${gameId} in database:`, updateData);
    } catch (error) {
      console.error("[Game] Error updating game in database:", error);
    }
  }

  // Create a bot game
  async createBotGame(ws, data) {
    try {
      const { user, difficulty = 'medium', playerColor = 'white', timeControl = 600 } = data;
      
      console.log(`[Bot Game] Creating bot game for user ${user.userId} with difficulty ${difficulty}`);
      
      const gameId = Math.random().toString(36).substring(2, 15);
      const chess = new Chess();
      const bot = new ChessBot(difficulty);
      
      // Create bot player object
      const botPlayer = {
        userId: 'bot_' + difficulty,
        username: `Chess Bot (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`,
        socket: null, // Bot doesn't have a socket
        isBot: true,
        difficulty: difficulty,
        rating: ChessBot.getDifficultyRating(difficulty)
      };
      
      // Assign colors
      let whitePlayer, blackPlayer;
      if (playerColor === 'white') {
        whitePlayer = { 
          socket: ws, 
          userId: user.userId, 
          username: user.username,
          rating: user.rating 
        };
        blackPlayer = botPlayer;
      } else {
        whitePlayer = botPlayer;
        blackPlayer = { 
          socket: ws, 
          userId: user.userId, 
          username: user.username,
          rating: user.rating 
        };
      }
      
      // Create game object
      const gameObj = {
        id: gameId,
        white_player: whitePlayer,
        black_player: blackPlayer,
        game: chess,
        whiteTimer: timeControl,
        blackTimer: timeControl,
        isStarted: false,
        isBot: true,
        bot: bot,
        botColor: playerColor === 'white' ? 'black' : 'white'
      };
      
      this.games.push(gameObj);
      
      // Store in database
      const dbGameId = await createGameInDatabase(
        whitePlayer.userId === 'bot_' + difficulty ? null : whitePlayer.userId,
        blackPlayer.userId === 'bot_' + difficulty ? null : blackPlayer.userId,
        timeControl,
        gameId
      );
      
      const startTime = Date.now() + 5000; // 5 seconds from now
      
      // Send game created message to human player
      ws.send(JSON.stringify({
        type: "bot_game_created",
        gameId,
        color: playerColor,
        board: chess.board(),
        startTime,
        botDifficulty: difficulty,
        botRating: ChessBot.getDifficultyRating(difficulty),
        opponentUsername: botPlayer.username
      }));
      
      console.log(`[Bot Game] Bot game ${gameId} created with user ${user.userId} as ${playerColor}`);
      
      // If bot plays white, make the first move after game starts
      if (playerColor === 'black') {
        setTimeout(() => {
          this.makeBotMove(gameId);
        }, 5500); // Slightly after game starts
      }
      
    } catch (error) {
      console.error("[Bot Game] Error creating bot game:", error);
      ws.send(JSON.stringify({
        type: "bot_game_error",
        error: "Failed to create bot game"
      }));
    }
  }
  
  // Make a bot move
  async makeBotMove(gameId) {
    try {
      const game = this.games.find(g => g.id === gameId && g.isBot);
      if (!game) {
        console.error("[Bot Game] Bot game not found:", gameId);
        return;
      }
      
      if (game.game.isGameOver()) {
        console.log("[Bot Game] Game is over, not making bot move");
        return;
      }
      
      const currentTurn = game.game.turn();
      const botColor = game.botColor;
      
      if (currentTurn !== botColor.charAt(0)) {
        console.log("[Bot Game] Not bot's turn, skipping move");
        return;
      }
      
      console.log(`[Bot Game] Bot making move for game ${gameId}`);
      
      // Add some thinking time for realism
      const thinkingTime = game.bot.difficulty === 'easy' ? 500 : 
                          game.bot.difficulty === 'medium' ? 1000 :
                          game.bot.difficulty === 'hard' ? 1500 : 2000;
      
      setTimeout(async () => {
        try {
          const move = game.bot.getBestMove(game.game.fen());
          
          if (!move) {
            console.error("[Bot Game] No valid move found for bot");
            return;
          }
          
          console.log(`[Bot Game] Bot move: ${move.san}`);
          
          // Make the move
          const result = game.game.move(move);
          if (!result) {
            console.error("[Bot Game] Invalid bot move:", move);
            return;
          }
          
          // Get human player
          const humanPlayer = String(game.white_player.userId).startsWith('bot_') ? 
                             game.black_player : game.white_player;
          
          // Send move to human player
          if (humanPlayer.socket && humanPlayer.socket.readyState === humanPlayer.socket.OPEN) {
            humanPlayer.socket.send(JSON.stringify({
              type: "move_update",
              gameId: gameId,
              move: result,
              board: game.game.board(),
              pgn: game.game.pgn(),
              currentTurn: game.game.turn(),
              isBot: true
            }));
          }
          
          // Check for game over conditions
          if (game.game.isGameOver()) {
            await this.handleBotGameEnd(game);
          }
          
        } catch (error) {
          console.error("[Bot Game] Error making bot move:", error);
        }
      }, thinkingTime);
      
    } catch (error) {
      console.error("[Bot Game] Error in makeBotMove:", error);
    }
  }
  
  // Handle bot game end
  async handleBotGameEnd(game) {
    try {
      let winner = null;
      let reason = "";
      
      if (game.game.isCheckmate()) {
        winner = game.game.turn() === 'w' ? 'black' : 'white';
        reason = "Checkmate";
      } else if (game.game.isStalemate()) {
        reason = "Stalemate";
      } else if (game.game.isDraw()) {
        reason = "Draw";
      }
      
      // Determine winner ID for database
      let winnerId = null;
      if (winner) {
        const winnerPlayer = winner === 'white' ? game.white_player : game.black_player;
        winnerId = String(winnerPlayer.userId).startsWith('bot_') ? null : winnerPlayer.userId;
      }
      
      // Update database
      await updateGameInDatabase(game.id, winnerId, game.game.pgn());
      
      // Send game end message to human player
      const humanPlayer = String(game.white_player.userId).startsWith('bot_') ? 
                         game.black_player : game.white_player;
      
      if (humanPlayer.socket && humanPlayer.socket.readyState === humanPlayer.socket.OPEN) {
        humanPlayer.socket.send(JSON.stringify({
          type: "bot_game_end",
          gameId: game.id,
          winner: winner,
          reason: reason,
          pgn: game.game.pgn()
        }));
      }
      
      // Remove game from active games
      const gameIndex = this.games.findIndex(g => g.id === game.id);
      if (gameIndex !== -1) {
        this.games.splice(gameIndex, 1);
      }
      
      console.log(`[Bot Game] Bot game ${game.id} ended: ${reason}`);
      
    } catch (error) {
      console.error("[Bot Game] Error handling bot game end:", error);
    }
  }
}