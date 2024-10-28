import { PrismaClient } from "@prisma/client";
import { Game } from "./game.js";
import { createGameInDatabase } from "./actions/db.js";

// user structure is like
// {
//     userId,
//     username,
//     socket,
// }


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
      if (parsedData.type == "create_10") {
        if (this.pendingTenPlayer === null) {
            this.pendingTenPlayer = {...parsedData.user,socket:ws};
        } else {
          // Create game in the database;
          let currUser = {...parsedData.user,socket:ws};
          const game = await createGameInDatabase(
            this.pendingTenPlayer,
            currUser
          );

          // If the game creation is successful, add the game instance
          if (game) {
            const newGame = new Game(this.pendingTenPlayer, currUser, game.id);
            console.log(newGame)
            this.games.push(newGame);

            console.log(this.pendingTenPlayer)
            let serverTime = Date.now();
            // Notify both players about the new game with the game ID
            this.pendingTenPlayer.socket.send(
              JSON.stringify({
                type: "game_created_10",
                gameId: game.id,
                color:"white",
                board: newGame.game.board(),
                startTime: serverTime + 5000,
                
              })
            );

            currUser.socket.send(
              JSON.stringify({
                type: "game_created_10",
                gameId: game.id,
                color:"black",
                board: newGame.game.board(),
                startTime: serverTime + 5000,
                whiteTime: 600,
                blackTime: 600,
              })
            );

            // Reset pending player
            this.pendingTenPlayer = null;
          }
        }
      }
      else if(parsedData.type == "move"){
        // update the game state
        try {
        const game = this.games.find(game => game.id === parsedData.gameId);
        game.game.move({from:parsedData.from,to:parsedData.to});
        game.isStarted = true;
        console.log(game.game.ascii());
        let whitePlayer = game.white_player;
          let blackPlayer = game.black_player;
          console.log(game.game.inCheck())
          console.log(game.game.isCheckmate())
          let inCheck = game.game.inCheck();
          let isCheckmate = game.game.isCheckmate();
           
            whitePlayer.socket.send(JSON.stringify({type:"update_timer",whiteTimer:parsedData.whiteTimer,blackTimer:parsedData.blackTimer,inCheck,isCheckmate,turn:game.game.turn(),inCheck:game.game.inCheck(),board:game.game.board(),move:{from:parsedData.from,to:parsedData.to}}));
        
            blackPlayer.socket.send(JSON.stringify({type:"update_timer",whiteTimer:parsedData.whiteTimer,blackTimer:parsedData.blackTimer,inCheck,isCheckmate,turn:game.game.turn(),board:game.game.board(), move:{from:parsedData.from,to:parsedData.to}}));
          
        } 
        catch(e){
          console.log("Invalid move");

        }
        
      }
      else if(parsedData.type == "get_game"){
        const userId = parsedData.user.userId;
        
        try {
          const game = this.games.find(game => game.id === parsedData.user.gameId);
        console.log(game);
          if(game.isStarted){
            ws.send(JSON.stringify({msg:"Sorry, game was deleted as you were not active or page got reloaded"}));
            return
          }
          // console.log(game);
          const serverTime = Date.now();
          
          ws.send(JSON.stringify({
            type: "fetched_game",
            gameId: game.id,
            color: game.white_player.userId === userId ? "white" : "black",
            board: game.game.board(),
            startTime: serverTime + 5000,
            whiteTime: 600,
            blackTime: 600,
          }));
          
        } 
        catch(e){
          console.log(e)
        }
      
      }
    });
  }

  
}
