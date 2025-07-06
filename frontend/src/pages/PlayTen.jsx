import React, { useEffect, useState, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { UserContext } from '../context/UserContext';
import { Chess } from 'chess.js';
import whitePawn from '../assets/pieces/wP.png';
import blackPawn from '../assets/pieces/bP.png';
import whiteKnight from '../assets/pieces/wN.png';
import blackKnight from '../assets/pieces/bN.png';
import whiteBishop from '../assets/pieces/wB.png';
import blackBishop from '../assets/pieces/bB.png';
import whiteRook from '../assets/pieces/wR.png';
import blackRook from '../assets/pieces/bR.png';
import whiteQueen from '../assets/pieces/wQ.png';
import blackQueen from '../assets/pieces/bQ.png';
import whiteKing from '../assets/pieces/wK.png';
import blackKing from '../assets/pieces/bK.png';
import loading from '../assets/animation/loading.gif';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from "axios"
import AnimatedPiece from '../components/AnimatedPiece';
import { useChessSounds } from '../utils/chessSounds';

const PlayTen = () => {
  const socket = useContext(SocketContext);
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const chessSounds = useChessSounds();

  const [isConnected, setIsConnected] = useState(false);
  const [gameBoard, setGameBoard] = useState([]);
  const [playerColor, setPlayerColor] = useState('');
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [myTimer, setMyTimer] = useState(600);
  const [opponentTimer, setOpponentTimer] = useState(600);
  const [gameId, setGameId] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [chessGame, setChessGame] = useState(new Chess());
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [kingInCheck, setKingInCheck] = useState(null); // New state for king in check
  const [isCheckMate, setIsCheckMate] = useState(false);
  
  // Animation states
  const [animatingPieces, setAnimatingPieces] = useState({});
  const [lastMove, setLastMove] = useState(null);
  const [capturedPiece, setCapturedPiece] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const matchTimerRef = useRef(null);
  const myTimerRef = useRef(null);
  const opponentTimerRef = useRef(null);

  

  useEffect(() => {
    if (socket && user?.user?.username) {
      const handleOpen = () => {
        setIsConnected(true);
        socket.send(JSON.stringify({
          type: 'create_10',
          user: { username: user.user.username, userId: user.user.id }
        }));
      };

      socket.addEventListener('open', handleOpen);

      if (socket.readyState === WebSocket.OPEN) {
        handleOpen();
      }

      return () => {
        socket.removeEventListener('open', handleOpen);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event) => {
        const parsedData = JSON.parse(event.data);
        console.log(parsedData);

        if (parsedData.type === 'game_created_10') {
          setPlayerColor(parsedData.color);
          navigate(`/game/${parsedData.gameId}`);
          setGameBoard(
            parsedData.color === 'white'
              ? parsedData.board
              : parsedData.board.map(row => row.reverse()).reverse()
          );
          setGameId(parsedData.gameId);
          setIsMyTurn(parsedData.color === 'white');
          startMatch(parsedData.startTime, parsedData.color);
        }
        else if (parsedData.type === 'update_timer') {
          // Always update timers first
          setMyTimer(playerColor === 'white' ? parsedData.whiteTimer : parsedData.blackTimer);
          setOpponentTimer(playerColor === 'white' ? parsedData.blackTimer : parsedData.whiteTimer);
          
          if (parsedData.turn === playerColor[0]) {
            // This means the opponent just made a move, and now it's my turn
            
            // Get piece and capture information before making the opponent's move
            const opponentPiece = chessGame.get(parsedData.move.from);
            const capturedByOpponent = chessGame.get(parsedData.move.to);
            
            // Animate opponent's move first
            if (opponentPiece) {
              animatePieceMove(parsedData.move.from, parsedData.move.to, opponentPiece, !!capturedByOpponent);
            }
            
            // Make the move in the chess game state
            const moveResult = chessGame.move({ from: parsedData.move.from, to: parsedData.move.to, promotion: parsedData.move.promotion });
            
            // Play sound for opponent's move
            if (moveResult) {
              chessSounds.playMoveSound(moveResult);
            }
            
            // Update the board state after a short delay to allow animation to show
            setTimeout(() => {
              const updatedBoard = playerColor === 'white'
                ? parsedData.board
                : parsedData.board.map(row => row.reverse()).reverse();
              setGameBoard(updatedBoard);
            }, 50);
            
            // Handle check state
            if (parsedData.inCheck) {
              console.log("It's a check");
              const kingSquare = chessGame.board().flat().find(piece => piece && piece.type === 'k' && piece.color === playerColor[0]);
              if (playerColor[0] === 'b') {
                setKingInCheck(kingSquare ? { row: (kingSquare.square[1] - 1), col: 7 - (kingSquare.square.charCodeAt(0) - 97) } : null);
              } else {
                setKingInCheck(kingSquare ? { row: 8 - kingSquare.square[1], col: kingSquare.square.charCodeAt(0) - 97 } : null);
              }
              if (parsedData.isCheckmate) {
                setIsCheckMate(true);
                setTimeout(() => {
                  if (playerColor[0] === parsedData.turn) {
                    alert("Checkmate, you lost");
                    navigate("/");
                  }
                }, 2000);
              }
            } else {
              setKingInCheck(null);
            }
            
            // Start my timer and stop opponent's
            startMyTimer();
            clearInterval(opponentTimerRef.current);
          } else {
            // It's not my turn, so just update the board immediately
            const updatedBoard = playerColor === 'white'
              ? parsedData.board
              : parsedData.board.map(row => row.reverse()).reverse();
            setGameBoard(updatedBoard);
          }
          
          // Always update turn state
          setIsMyTurn(parsedData.turn === playerColor[0]);
        }
      };

      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, playerColor, chessGame]);

 

  const startMatch = (startTime, color) => {
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current);
    }

    matchTimerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const timeLeft = Math.floor((startTime - currentTime) / 1000);
      if (timeLeft <= 0) {
        clearInterval(matchTimerRef.current);
        setIsMatchStarted(true);
        if (color === 'white') {
          startMyTimer();
        } else {
          startOpponentTimer();
        }
      }
    }, 1000);
  };

  const startMyTimer = () => {
    if (myTimerRef.current) {
      clearInterval(myTimerRef.current);
    }

    myTimerRef.current = setInterval(() => {
      setMyTimer((prev) => {
        if (prev <= 0) {
          clearInterval(myTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startOpponentTimer = () => {
    if (opponentTimerRef.current) {
      clearInterval(opponentTimerRef.current);
    }

    opponentTimerRef.current = setInterval(() => {
      setOpponentTimer((prev) => {
        if (prev <= 0) {
          clearInterval(opponentTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDragStart = (piece, fromRow, fromCol) => {
    setDraggedPiece({ piece, fromRow, fromCol });
  };

  // Animation helper functions
  const animatePieceMove = (fromSquare, toSquare, piece, isCapture = false) => {
    const moveKey = `${fromSquare}-${toSquare}`;
    
    console.log(`Animating move: ${fromSquare} to ${toSquare}`, piece);
    
    // Set animation state
    setAnimatingPieces(prev => ({
      ...prev,
      [moveKey]: {
        from: fromSquare,
        to: toSquare,
        piece,
        isCapture
      }
    }));

    // Store last move for highlighting (immediate)
    setLastMove({ from: fromSquare, to: toSquare });

    // Clear animation after duration
    setTimeout(() => {
      setAnimatingPieces(prev => {
        const newState = { ...prev };
        delete newState[moveKey];
        return newState;
      });
    }, 400); // Increased duration for better visibility
  };

  const coordinateToRowCol = (coord) => {
    if (playerColor === 'white') {
      return {
        row: 8 - parseInt(coord[1]),
        col: coord.charCodeAt(0) - 97
      };
    } else {
      const columnTranspose = {
        'a': 7, 'b': 6, 'c': 5, 'd': 4,
        'e': 3, 'f': 2, 'g': 1, 'h': 0
      };
      return {
        row: parseInt(coord[1]) - 1,
        col: columnTranspose[coord[0]]
      };
    }
  };

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault();
    const { piece, fromRow, fromCol } = draggedPiece;
    let fromCoord, toCoord;

    // Convert coordinates based on player color
    if (playerColor === 'white') {
      fromCoord = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`;
      toCoord = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    } else {
      const columnTranspose = {
        'a': 'h', 'b': 'g', 'c': 'f', 'd': 'e',
        'e': 'd', 'f': 'c', 'g': 'b', 'h': 'a'
      };
      fromCoord = `${columnTranspose[String.fromCharCode(97 + fromCol)]}${fromRow + 1}`;
      toCoord = `${columnTranspose[String.fromCharCode(97 + toCol)]}${toRow + 1}`;
    }

    // Get piece and capture information before making the move
    const movingPiece = chessGame.get(fromCoord);
    const capturedPiece = chessGame.get(toCoord);
    
    // Animate the move
    if (movingPiece) {
      animatePieceMove(fromCoord, toCoord, movingPiece, !!capturedPiece);
    }

    // Validate the move with chess.js
    const move = chessGame.move({ from: fromCoord, to: toCoord });
    if (move) {
      // Play sound for player's move
      chessSounds.playMoveSound(move);
      
      // Update the board state immediately for current player
      const newBoard = chessGame.board();
      const updatedBoard = playerColor === 'white'
        ? newBoard
        : newBoard.map(row => row.reverse()).reverse();
      
      // Small delay to show animation start, then update board
      setTimeout(() => {
        setGameBoard(updatedBoard);
      }, 50);

      if(chessGame.isCheckmate()){
        setIsCheckMate(true);
          
          axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/user/game/update/winnerId`,{gameId,winnerId:user.user.id,pgn:chessGame.pgn()},{
            headers:{
              'Authorization':`Bearer ${localStorage.getItem("auth_token")}`
            }
          }).then((response)=>{
            console.log(response.data)
            alert("Congratulations, you won the game")
          }).catch(e=>{
            console.log(e)
          })
          // request to end the game

          setTimeout(()=>{
            navigate("/")
          },5000)
         
      }
      socket.send(JSON.stringify({
        gameId,
        type: 'move',
        from: fromCoord,
        to: toCoord,
        whiteTimer: playerColor === 'white' ? myTimer : opponentTimer,
        blackTimer: playerColor === 'black' ? myTimer : opponentTimer,
      }));
      setKingInCheck(null)
      clearInterval(myTimerRef.current);
      startOpponentTimer();
      setDraggedPiece(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const renderPiece = (piece, rowIndex, colIndex) => {
    if (!piece) return null;
    const isDraggable = isMyTurn && piece.color === playerColor[0];

    const pieceImages = {
      wP: whitePawn,
      bP: blackPawn,
      wN: whiteKnight,
      bN: blackKnight,
      wB: whiteBishop,
      bB: blackBishop,
      wR: whiteRook,
      bR: blackRook,
      wQ: whiteQueen,
      bQ: blackQueen,
      wK: whiteKing,
      bK: blackKing,
    };
    
    // Check if this piece is currently animating
    const currentSquare = playerColor === 'white' 
      ? `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`
      : `${String.fromCharCode(104 - colIndex)}${rowIndex + 1}`;
    
    let animationClass = '';
    let isAnimating = false;
    
    // Check if this square is part of the last move (for highlighting)
    const isLastMoveSquare = lastMove && (
      (lastMove.from === currentSquare) || (lastMove.to === currentSquare)
    );
    
    // Check for animation states
    Object.values(animatingPieces).forEach(anim => {
      if (anim.to === currentSquare) {
        animationClass = 'chess-piece-fade-in';
        isAnimating = true;
      }
      if (anim.from === currentSquare && anim.isCapture) {
        animationClass = 'chess-piece-captured';
        isAnimating = true;
      }
    });
    
    const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
    
    return (
      <AnimatedPiece
        piece={piece}
        rowIndex={rowIndex}
        colIndex={colIndex}
        isAnimating={isAnimating}
        animationClass={animationClass}
        isDraggable={isDraggable}
        onDragStart={handleDragStart}
        pieceImages={pieceImages}
      />
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
      if (myTimerRef.current) clearInterval(myTimerRef.current);
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current);
    };
  }, []);

  // Update sound mute state when toggle changes
  useEffect(() => {
    chessSounds.setMuted(!soundEnabled);
  }, [soundEnabled, chessSounds]);

  if (!isMatchStarted) {
    return (
      <div className='h-screen w-full bg-black flex items-center justify-center'>
        <img className='h-[10%] w-[10%]' src={loading} alt='loading...' />
        <h1 className='text-white text-2xl'>
        Loding.....</h1>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-900'>
      <div className='Board-with-timer flex flex-col h-[900px] w-[900px] items-center justify-center bg-black gap-5'>
        <div className='h-[10%] w-[70%] flex justify-between p-2'>
          <div className='opponent-timer h-full w-[30%] bg-green-500 rounded-lg flex items-center justify-center text-white text-xl'>
            {formatTime(opponentTimer)}
          </div>
          <div className='opponent-pieces basis-1/2 h-full w-[30%] bg-green-500 rounded-lg flex items-center justify-center text-white text-xl'>
            pieces
          </div>
        </div>
        <div className="grid grid-cols-8 gap-0 w-[640px] h-[640px] border border-gray-600">
          {gameBoard.map((row, rowIndex) => {
            return row.map((piece, colIndex) => {
              // Calculate the current square coordinate
              const currentSquare = playerColor === 'white' 
                ? `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`
                : `${String.fromCharCode(104 - colIndex)}${rowIndex + 1}`;
              
              // Check if this square is part of the last move
              const isLastMoveSquare = lastMove && (
                lastMove.from === currentSquare || lastMove.to === currentSquare
              );
              
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`w-[80px] h-[80px] flex items-center justify-center text-2xl ${
                    (rowIndex + colIndex) % 2 === 0 ? 'bg-gray-200' : 'bg-gray-400'
                  } ${kingInCheck && kingInCheck.row === rowIndex && kingInCheck.col === colIndex ? 'bg-red-500' : ''} ${
                    isLastMoveSquare ? 'chess-square-highlight' : ''
                  }`}
                  onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                  onDragOver={handleDragOver}
                >
                  {renderPiece(piece, rowIndex, colIndex)}
                </div>
              );
            });
          })}
        </div>
        <div className='h-[10%] w-[70%] flex justify-between p-2'>
          <div className='my-timer h-full w-[30%] bg-green-500 rounded-lg flex items-center justify-center text-white text-xl'>
            {formatTime(myTimer)}
          </div>
          <div className='opponent-pieces h-full basis-1/2 w-[30%] bg-green-500 rounded-lg flex items-center justify-center text-white text-xl'>
            pieces
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayTen;
