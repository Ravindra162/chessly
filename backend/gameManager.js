import { Game } from "./game.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class GameManager {
    games = [];
    pendingUser;
    users = [];
    pen_ten_user;

    constructor() {
        this.games = [];
        this.users = [];
        this.pendingUser = null;
        this.pen_ten_user = null;
    }

    addUser(socket) {
        this.users.push(socket);
        this.addHandler(socket);
    }

    removeUser(socket) {
        this.users = this.users.filter(user => user !== socket);
        this.games = this.games.filter(
            game => game.player1 !== socket && game.player2 !== socket
        );
    }

    async createGameInDB(socket, userId) {
        console.log("Creating game in DB with userId:", userId);
        
        try {
            const penTenUser = this.pen_ten_user;
            console.log("Pen_ten_user details:", penTenUser.userId);

            // Create a new game instance in memory for real-time interaction
            const game = new Game(penTenUser.socket, socket);
            game.timeRemaining = {
                white: 600,
                black: 600,
            };

            // Store the game in the database with relations to `white` and `black` players
            const newGame = await prisma.games.create({
                data: {
                    white: {
                        connect: { id: penTenUser.userId },
                    },
                    black: {
                        connect: { id: userId },
                    },
                    time: 600, // Total game time: 10 minutes in seconds
                    time_remaining_white: 600,
                    time_remaining_black: 600,
                    pgn: '',
                    board: game.board.board(), // Store the initial board state
                },
            });

            console.log('New game created in the database:', newGame);

            // Add the game to in-memory storage with the new game ID
            game.id = newGame.id;
            this.games.push(game);

            // Send the game UUID and initial board state to both players
            const gameData = {
                type: 'game_created',
                gameId: newGame.id,
                board: game.board.board(),
                timeRemaining: game.timeRemaining,
            };
            socket.send(
                JSON.stringify({ ...gameData, color: 'black' }),
                (err) => {
                    if (err) {
                        console.error('Error sending game start message to black player:', err);
                    } else {
                        console.log('Game start message successfully sent to black player.');
                    }
                }
            );
            penTenUser.socket.send(
                JSON.stringify({ ...gameData, color: 'white' }),
                (err) => {
                    if (err) {
                        console.error('Error sending game start message to white player:', err);
                    } else {
                        console.log('Game start message successfully sent to white player.');
                    }
                }
            );
            

            console.log('Game start messages with board and time remaining sent to both players.');

            // Reset pen_ten_user for the next game
            this.pen_ten_user = null;

        } catch (error) {
            console.error('Error creating a game in the database:', error);
        }
    }

    addHandler(socket) {
        socket.on('message', async (message) => {
            const parsedMessage = JSON.parse(message.toString());
            console.log("Received message:", parsedMessage);

            if (parsedMessage.type === 'init_game') {
                if (this.pendingUser === null) {
                    this.pendingUser = socket;
                    console.log('Pending user set.');
                } else {
                    const game = new Game(this.pendingUser, socket);
                    this.games.push(game);
                    console.log('Game created between:', this.pendingUser, socket);

                    this.pendingUser.send(
                        JSON.stringify({
                            type: 'game_start',
                            color: 'white',
                            board: game.board.board(),
                        })
                    );
                    socket.send(
                        JSON.stringify({
                            type: 'game_start',
                            color: 'black',
                            board: game.board.board(),
                        })
                    );
                    console.log('Game start messages sent to both players.');
                    this.pendingUser = null;
                }
            }

            if (parsedMessage.type === 'move') {
                const game = this.games.find(
                    (game) => game.player1 === socket || game.player2 === socket
                );
                if (game) {
                    game.makeMove(socket, parsedMessage.from, parsedMessage.to);
                    await this.updateTimeAndBoardInDB(game);
                }
            }

            if (parsedMessage.type === 'start_10') {
                console.log("Start 10 message received with userId:", parsedMessage.userId);
                if (this.pen_ten_user === null) {
                    this.pen_ten_user = { userId: parsedMessage.userId, socket: socket };
                    console.log("10 min user is now in pending:", this.pen_ten_user);
                } else {
                    const penTenUser = this.pen_ten_user; // Save reference to current pending user
                    console.log("Creating game for 10-minute mode between users.");

                    await this.createGameInDB(socket, parsedMessage.userId);

                    // Check if penTenUser is still valid after game creation
                    if (penTenUser) {
                        console.log('Game created in the database between:', penTenUser.userId, parsedMessage.userId);
                    } else {
                        console.error('penTenUser was null after game creation.');
                    }
                }
            }
        });

        socket.on('close', () => {
            this.removeUser(socket);
            console.log('User disconnected and removed from the game.');
        });
    }

    async updateTimeAndBoardInDB(game) {
        try {
            await prisma.games.update({
                where: { id: game.id },
                data: {
                    time_remaining_white: game.timeRemaining.white,
                    time_remaining_black: game.timeRemaining.black,
                    boardState: game.board.board(), // Update the current board state
                },
            });
            console.log('Updated time and board state in the database for game:', game.id);
        } catch (error) {
            console.error('Error updating time and board state in the database:', error);
        }
    }
}

export { GameManager };
