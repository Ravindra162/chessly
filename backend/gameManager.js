import { PrismaClient } from "@prisma/client";
import { Game } from "./game.js";
import { createGameInDatabase, updateGameInDatabase } from "./actions/db.js";

export class GameManager {
  games = [];
  users = [];
  pendingTenPlayer = null;

  constructor() {
    this.games = [];
    this.users = [];
    this.pendingTenPlayer = null;
  }

  addHandler(ws) {
    ws.on("message", async (data) => {
      const parsedData = JSON.parse(data);
      console.log(parsedData);

      if (parsedData.type === "create_10") {
        if (this.pendingTenPlayer === null) {
          this.pendingTenPlayer = { ...parsedData.user, socket: ws };
        } else {
          let currUser = { ...parsedData.user, socket: ws };
          const game = await createGameInDatabase(this.pendingTenPlayer, currUser);

          if (game) {
            const newGame = new Game(this.pendingTenPlayer, currUser, game.id);
            this.games.push(newGame);

            let serverTime = Date.now();
            this.pendingTenPlayer.socket.send(JSON.stringify({
              type: "game_created_10",
              gameId: game.id,
              color: "white",
              board: newGame.game.board(),
              startTime: serverTime + 5000,
              whiteTime: 30,
              blackTime: 30,
            }));

            currUser.socket.send(JSON.stringify({
              type: "game_created_10",
              gameId: game.id,
              color: "black",
              board: newGame.game.board(),
              startTime: serverTime + 5000,
              whiteTime: 30,
              blackTime: 30,
            }));

            this.pendingTenPlayer = null;
          }
        }
      }
      else if (parsedData.type === "move") {
        try {
          const game = this.games.find(game => game.id === parsedData.gameId);
          const moveObj = { from: parsedData.from, to: parsedData.to };
          if (parsedData.promotion) {
            moveObj.promotion = parsedData.promotion;
          }
          game.game.move(moveObj);
          game.isStarted = true;
          console.log(game.game.ascii());

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

          whitePlayer.socket.send(JSON.stringify(updateData));
          blackPlayer.socket.send(JSON.stringify(updateData));
        } 
        catch (e) {
          console.log("Invalid move:", e);
        }
      }
      else if (parsedData.type === "get_game") {
        const userId = parsedData.user.userId;
        try {
          const game = this.games.find(game => game.id === parsedData.user.gameId);
          const currentUsername = userId === game.white_player.userId ? game.white_player.username : game.black_player.username;
          const opponentUsername = userId === game.white_player.userId ? game.black_player.username : game.white_player.username;

          if (game.isStarted) {
            game.white_player.socket = game.white_player.userId === userId ? ws : game.white_player.socket;
            game.black_player.socket = game.black_player.userId === userId ? ws : game.black_player.socket;

            ws.send(JSON.stringify({
              type: "existing_game",
              gameId: game.id,
              color: game.white_player.userId === userId ? "white" : "black",
              whiteTime: game.whiteTimer,
              blackTime: game.blackTimer,
              board: game.game.board(),
              startTime: Date.now(),
              pgn: game.game.pgn(),
              currentUsername,
              opponentUsername
            }));
            return;
          }

          const serverTime = Date.now();
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
        } 
        catch (e) {
          console.log(e);
        }
      }
      else if (parsedData.type === "end_game") {
        const { reason } = parsedData;
        const game = this.games.find(game => game.id === parsedData.gameId);
        const whitePlayerSocket = game.white_player.socket;
        const blackPlayerSocket = game.black_player.socket;
        let winnerId = null;
        const userId = parsedData.userId;

        if (reason === "resign") {
          winnerId = (userId === game.white_player.userId ? game.black_player.userId : game.white_player.userId);
          const opponentSocket = userId === game.white_player.userId ? blackPlayerSocket : whitePlayerSocket;
          await updateGameInDatabase(parsedData.gameId, winnerId, game.game.pgn());
          opponentSocket.send(JSON.stringify({ type: "end_game", reason: "Opponent resigned" }));
        } else if (reason === "time") {
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
          // Draw case, no winner
          await updateGameInDatabase(parsedData.gameId, null, game.game.pgn()); // null winnerId for draw
          whitePlayerSocket.send(JSON.stringify({ type: "end_game", reason: reason === "stalemate" ? "Stalemate! The game is a draw." : "Threefold repetition! The game is a draw." }));
          blackPlayerSocket.send(JSON.stringify({ type: "end_game", reason: reason === "stalemate" ? "Stalemate! The game is a draw." : "Threefold repetition! The game is a draw." }));
        }
      }
    });
  }
}