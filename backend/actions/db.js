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
        },
      });
      return game;
    } catch (error) {
      console.error("Error creating game in database:", error);
      return null;
    }
  }

  async function updateGameInDatabase(gameId,winnerId,pgn){
    try {
      console.log("Updating game in database with winnerId:", winnerId);
      const game = await prisma.games.update({
        where: {
          id: gameId,
        },
        data: {
          pgn: pgn,
          winnerId: winnerId,
        },
      });

      console.log("Game updated in database:", game);
    }
    catch(error){
      console.error("Error updating game in database:", error);
    }
  }

  export {createGameInDatabase, updateGameInDatabase}