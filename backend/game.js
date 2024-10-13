import { Chess } from "chess.js";

class Game {
    player1; 
    player2;
    board;
    id;

    constructor(player1, player2,id) {
        this.player1 = player1;
        this.player2 = player2;
        this.id = id;
        this.board = new Chess();
    }

    makeMove(socket, from, to){
        try{
            console.log("making move.....")
    
      
       
            console.log("emittting...")
            console.log("Turn:", this.board.turn());
            console.log("Attempting move from:", from, "to:", to);
            let moveResult = this.board.move({
                from:from,
                to:to,
            });
            console.log("moveResult:", moveResult); 
            console.log("Current board state:", this.board.ascii());
            
            this.player1.send(JSON.stringify({type:"MOVE", from, to, board: this.board.board(), color:'white', move:moveResult.san}));
            this.player2.send(JSON.stringify({type:"MOVE", from, to, board: this.board.board(), color:'black',  move:moveResult.san}));
            console.log("emitted")
            if(this.board.isGameOver()){
                console.log("Game over")
                this.player1.send(JSON.stringify({type:"GAME_OVER"}), {result: this.board.board()});
                this.player1.send(JSON.stringify({type:"GAME_OVER"}), {result: this.board.board()});
            }

    }
        catch(e){
            console.log(e);
        }
    }

}

export {Game}