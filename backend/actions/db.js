import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createGameInDatabase(whitePlayerId, blackPlayerId, timeControl = 600, gameId = null) {
    try {
      // For bot games, one of the player IDs might be null
      const gameData = {
        time: timeControl,
        pgn: "",
      };
      
      // Add player IDs only if they exist (not bot)
      if (whitePlayerId && !whitePlayerId.toString().startsWith('bot_')) {
        gameData.whiteId = whitePlayerId;
      }
      
      if (blackPlayerId && !blackPlayerId.toString().startsWith('bot_')) {
        gameData.blackId = blackPlayerId;
      }
      
      // If custom gameId is provided, use it
      if (gameId) {
        gameData.id = gameId;
      }
      
      const game = await prisma.games.create({
        data: gameData,
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