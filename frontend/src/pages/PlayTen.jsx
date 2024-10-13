import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import Piece from '../assets/Piece';
import Board from '../components/Board';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const PlayTen = () => {
  const { gameId } = useParams();
  const socket = useContext(SocketContext);
  const [User, setUser] = useState('');
  const user = useContext(UserContext);
  const [current, setCurrent] = useState('white');
  const [board, setBoard] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [opponentEmail, setOpponentEmail] = useState('');
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPlayerWhite, setIsPlayerWhite] = useState(true);

  useEffect(() => {
    if (user !== null) setUser(user);
  }, [user]);

  const startGame = useCallback(() => {
    setIsGameStarted(true);
  }, []);

  const switchTurn = useCallback(() => {
    setIsWhiteTurn(prevTurn => !prevTurn);
  }, []);

  useEffect(() => {
    if (!gameId) return;
    axios
      .get(`http://localhost:3000/user/game/${gameId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      .then((response) => {
        const { board, time_remaining_white, time_remaining_black, whiteId, blackId } = response.data;
        if (user.user !== "") {
          if (user.user.id === whiteId) {
            setBoard(board);
            setWhiteTime(time_remaining_white);
            setBlackTime(time_remaining_black);
            fetchOpponentEmail(blackId);
            setIsPlayerWhite(true);
            setCurrent('white');
          } else {
            setBoard(board.map(row => [...row].reverse()).reverse());
            setWhiteTime(time_remaining_black);
            setBlackTime(time_remaining_white);
            fetchOpponentEmail(whiteId);
            setIsPlayerWhite(false);
            setCurrent('black');
          }
        }
        startGame();
      })
      .catch((error) => {
        console.error('Error fetching game:', error);
      });
  }, [user, gameId, startGame]);

  useEffect(() => {
    let timer;
    if (isGameStarted) {
      timer = setInterval(() => {
        if (isWhiteTurn) {
          setWhiteTime(prevTime => {
            if (prevTime <= 0) {
              clearInterval(timer);
              // Handle white losing on time
              return 0;
            }
            return prevTime - 1;
          });
        } else {
          setBlackTime(prevTime => {
            if (prevTime <= 0) {
              clearInterval(timer);
              // Handle black losing on time
              return 0;
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGameStarted, isWhiteTurn]);

  const fetchOpponentEmail = (opponentId) => {
    // TODO: Implement this function to fetch the opponent's email using their ID
    setOpponentEmail('opponent@example.com');
  };

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (data) => {
      const message = JSON.parse(data.data);
      console.log(message);

      if (message.type === 'updateBoard') {
        if (current === 'black') {
          setBoard(message.board.map(row => [...row].reverse()).reverse());
        } else {
          setBoard(message.board);
        }
        setWhiteTime(message.whiteTime);
        setBlackTime(message.blackTime);
        switchTurn();
      }
    };

    // return () => {
    //   socket.close();
    // };
  }, [socket, switchTurn, current]);

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-800';
  };

  const renderPiece = (col, rowIndex, colIndex) => {
    if (!col || !col.type) return null;
    return (
      <span
        className={`text-3xl h-full w-full ${col.color === 'white' ? 'text-black' : 'text-white'}`}
        draggable={col.color === current[0]}
        onDragStart={() => handleDragStart(col, rowIndex, colIndex)}
      >
        {<Piece type={getPieceSymbol(col.type, col.color)} />}
      </span>
    );
  };

  const handleDragStart = (piece, rowIndex, colIndex) => {
    const from = getChessNotation(rowIndex, colIndex);
    setDraggedPiece({ piece, from });
  };

  const handleDrop = (rowIndex, colIndex) => {
    if (draggedPiece) {
      const to = getChessNotation(rowIndex, colIndex);
      console.log(`Moved from ${draggedPiece.from} to ${to}`);

      socket.send(
        JSON.stringify({
          type: 'move',
          from: draggedPiece.from,
          to: to,
          gameId,
          timeRemaining: isPlayerWhite ? whiteTime : blackTime
        })
      );

      setDraggedPiece(null);
      switchTurn();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getChessNotation = (rowIndex, colIndex) => {
    const file = current === 'black' ? 'hgfedcba' : 'abcdefgh';
    const column = file[colIndex];
    const row = current === 'black' ? rowIndex + 1 : 8 - rowIndex;
    return `${column}${row}`;
  };

  const getPieceSymbol = (type, color) => {
    return color && type ? `${color[0]}${type.toUpperCase()}` : '';
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className='h-screen w-full bg-slate-300 flex justify-center items-center'>
      <div className='h-[85%] w-[80%] bg-green-400 flex flex-col justify-evenly items-center'>
        <div className='w-full text-center mb-4'>
          <p>{opponentEmail}</p>
          <p className={`text-2xl font-bold ${isPlayerWhite ? (!isWhiteTurn ? 'text-red-500' : '') : (isWhiteTurn ? 'text-red-500' : '')}`}>
            {isPlayerWhite ? formatTime(blackTime) : formatTime(whiteTime)}
          </p>
        </div>
        <Board
          getSquareColor={getSquareColor}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          renderPiece={renderPiece}
          board={board}
        />
        <div className='w-full text-center mt-4'>
          <p className={`text-2xl font-bold ${isPlayerWhite ? (isWhiteTurn ? 'text-red-500' : '') : (!isWhiteTurn ? 'text-red-500' : '')}`}>
            {isPlayerWhite ? formatTime(whiteTime) : formatTime(blackTime)}
          </p>
          <p>{user.user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayTen;