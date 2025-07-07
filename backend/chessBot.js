import { Chess } from 'chess.js';

export class ChessBot {
  constructor(difficulty = 'easy') {
    this.difficulty = difficulty;
    this.transpositionTable = new Map();
  }

  // Main function to get bot move
  getBestMove(fen, timeLimit = 1000) {
    const chess = new Chess(fen);
    
    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove(chess);
      case 'medium':
        return this.getMiniMaxMove(chess, 2);
      case 'hard':
        return this.getMiniMaxMove(chess, 3);
      case 'expert':
        return this.getMiniMaxMove(chess, 4);
      default:
        return this.getRandomMove(chess);
    }
  }

  // Random move for easy difficulty
  getRandomMove(chess) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Add slight preference for captures and checks
    const captures = moves.filter(move => move.captured);
    const checks = moves.filter(move => {
      chess.move(move);
      const inCheck = chess.inCheck();
      chess.undo();
      return inCheck;
    });
    
    if (this.difficulty === 'easy' && Math.random() < 0.3 && captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    
    if (this.difficulty === 'easy' && Math.random() < 0.2 && checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    }
    
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Minimax algorithm for higher difficulties
  getMiniMaxMove(chess, depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    const moves = chess.moves({ verbose: true });
    
    // Order moves (captures first, then other moves)
    const orderedMoves = this.orderMoves(chess, moves);
    
    for (const move of orderedMoves) {
      chess.move(move);
      const value = this.minimax(chess, depth - 1, -Infinity, Infinity, false);
      chess.undo();
      
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  // Minimax with alpha-beta pruning
  minimax(chess, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluatePosition(chess);
    }
    
    const moves = chess.moves({ verbose: true });
    const orderedMoves = this.orderMoves(chess, moves);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of orderedMoves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  // Order moves for better alpha-beta pruning
  orderMoves(chess, moves) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Prioritize captures
      if (a.captured) scoreA += 10 + this.getPieceValue(a.captured);
      if (b.captured) scoreB += 10 + this.getPieceValue(b.captured);
      
      // Prioritize checks
      chess.move(a);
      if (chess.inCheck()) scoreA += 5;
      chess.undo();
      
      chess.move(b);
      if (chess.inCheck()) scoreB += 5;
      chess.undo();
      
      return scoreB - scoreA;
    });
  }

  // Evaluate chess position
  evaluatePosition(chess) {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -9999 : 9999;
    }
    
    if (chess.isStalemate() || chess.isDraw()) {
      return 0;
    }
    
    let score = 0;
    const board = chess.board();
    
    // Material evaluation
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = this.getPieceValue(piece.type);
          const positionValue = this.getPositionValue(piece.type, i, j, piece.color);
          
          if (piece.color === 'b') {
            score += value + positionValue;
          } else {
            score -= value + positionValue;
          }
        }
      }
    }
    
    // Add some randomness for lower difficulties
    if (this.difficulty === 'easy') {
      score += (Math.random() - 0.5) * 200;
    } else if (this.difficulty === 'medium') {
      score += (Math.random() - 0.5) * 50;
    }
    
    return score;
  }

  // Get piece values
  getPieceValue(piece) {
    const values = {
      'p': 100,
      'n': 320,
      'b': 330,
      'r': 500,
      'q': 900,
      'k': 20000
    };
    return values[piece] || 0;
  }

  // Get position values (simplified piece-square tables)
  getPositionValue(piece, row, col, color) {
    // Simplified position tables for pawns and knights
    const pawnTable = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];
    
    const knightTable = [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50]
    ];
    
    let table = [];
    if (piece === 'p') table = pawnTable;
    else if (piece === 'n') table = knightTable;
    else return 0;
    
    // Flip table for white pieces
    const adjustedRow = color === 'w' ? 7 - row : row;
    
    return table[adjustedRow][col] / 10;
  }

  // Get difficulty description
  static getDifficultyDescription(difficulty) {
    const descriptions = {
      'easy': 'Beginner - Makes random moves with basic tactics',
      'medium': 'Intermediate - Looks 2 moves ahead',
      'hard': 'Advanced - Looks 3 moves ahead with good tactics',
      'expert': 'Expert - Looks 4 moves ahead with strong evaluation'
    };
    return descriptions[difficulty] || descriptions['easy'];
  }

  // Get estimated rating for difficulty
  static getDifficultyRating(difficulty) {
    const ratings = {
      'easy': 800,
      'medium': 1200,
      'hard': 1600,
      'expert': 2000
    };
    return ratings[difficulty] || ratings['easy'];
  }
}
