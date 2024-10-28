import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createGameInDatabase(whitePlayer, blackPlayer) {
    try {
      const game = await prisma.games.create({
        data: {
          whiteId: whitePlayer.userId,
          blackId: blackPlayer.userId,
          time: 600, // Example time control (10 minutes per player)
          pgn: "",
          board: JSON.stringify([
            // Initialize the board with starting positions
          ]),
        },
      });
      return game;
    } catch (error) {
      console.error("Error creating game in database:", error);
      return null;
    }
  }

  export {createGameInDatabase}