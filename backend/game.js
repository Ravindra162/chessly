// users : {
//     userId,
//     username,socket,
//     role -> white or black or spectaot
// }
import { Chess } from "chess.js";

export class Game{

    white_player
    black_player
    game
    id
    white_timer
    black_timer
    game_time
    isStarted

    


    constructor(player1,player2,id){
        this.white_player = player1;
        this.black_player = player2;
        this.id = id;
        this.game = new Chess();
        this.isStarted = false
    }



}