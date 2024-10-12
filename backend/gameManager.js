 import { Game } from "./game.js";
 class GameManager {
     games = [];
     pendingUser;
     users = []

    constructor(){
        this.games = []
        this.users = []
        this.pendingUser = null
    }
    
    addUser(socket){
        this.users.push(socket);
        this.addHandler(socket);
    }

    removeUser(socket){

    }
    addHandler(socket){
        socket.on('message', (message) => {
            const parsedMessage = JSON.parse(message.toString());
            console.log(parsedMessage)
            if (parsedMessage.type === 'init_game') {
                if (this.pendingUser === null) {
                    this.pendingUser = socket; 
                    console.log('Pending user set to:');
                } else {
                    const game = new Game(this.pendingUser, socket);
                    this.games.push(game);
                    console.log('Game created between:', this.pendingUser, socket);
                    this.pendingUser.send(JSON.stringify({ type: 'game_start', color: 'white', board: game.board.board() }));
                    socket.send(JSON.stringify({ type: 'game_start', color: 'black', board: game.board.board() }));
                    console.log('Game start messages sent to both players.');
                    this.pendingUser = null;
                }
            }
            
            if(parsedMessage.type === 'move'){

                const game = this.games.find(game=>game.player1 === socket || game.player2 === socket);
                if(game){
                    game.makeMove(socket, parsedMessage.from, parsedMessage.to);
                }

            }
        });
    }
a

    
  
}

export { GameManager };