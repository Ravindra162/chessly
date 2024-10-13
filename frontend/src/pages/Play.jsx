import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import Piece from '../assets/Piece';
import Board from '../components/Board';

const Play = () => {
  const socket = useContext(SocketContext);
  const [current, setCurrent] = useState('white');
  const [board, setBoard] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const sendMessage = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'init_game' }));
      } else {
        console.error("WebSocket is not open. Ready state: ", socket.readyState);
      }
    };

    socket.onopen = () => {
      console.log("WebSocket connection established");
      sendMessage();
    };

    const handleMessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(data);

      if (data.type === "game_start") {
        setCurrent(data.color);
        // Adjust the board for black's perspective
        if (data.color === 'black') {
          setBoard(data.board.map(row => [...row].reverse()).reverse());
        } else {
          setBoard(data.board);
        }
      }
      if(data.type==="MOVE"){
        setCurrent(data.color);
        // Adjust the board for black's perspective
        if (data.color === 'black') {
          setBoard(data.board.map(row => [...row].reverse()).reverse());
        } else {
          setBoard(data.board);
        }
      }
    };

    socket.onmessage = handleMessage;

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.close();
    };
  }, [socket]);

  const getSquareColor = (row, col) => {
    return (row + col) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-800';
  };

  const renderPiece = (col, rowIndex, colIndex) => {
    if (!col || !col.type) return null;
      console.log(current)
    return (
      <span
        className={`text-3xl h-full w-full ${col.color === 'white' ? 'text-black' : 'text-white'}`}
        draggable={col.color===current[0]?true:false}
        onDragStart={() => handleDragStart(col, rowIndex, colIndex)}
      >
        {<Piece type={getPieceSymbol(col.type, col.color)}/>}
      </span>
    );
  };

  const handleDragStart = (piece, rowIndex, colIndex) => {
    // Calculate the 'from' position in standard chess notation
    const from = getChessNotation(rowIndex, colIndex);
    setDraggedPiece({ piece, from });
  };

  const handleDrop = (rowIndex, colIndex) => {
    if (draggedPiece) {
      // Calculate the 'to' position in standard chess notation
      const to = getChessNotation(rowIndex, colIndex);

      console.log(`Moved from ${draggedPiece.from} to ${to}`);

      // Send the move to the server
      socket.send(
        JSON.stringify({
          type: "move",
          from: draggedPiece.from,
          to: to,
        })
      );

      setDraggedPiece(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getChessNotation = (rowIndex, colIndex) => {
    let file
    if(current==="black")file = "hgfedcba"
    else file = "abcdefgh"
    const column = file[colIndex];
    const row = current === 'black' ? rowIndex+1 : 7-rowIndex + 1;
    return `${column}${row}`;
  };

  const getPieceSymbol = (type, color) => {
    return color && type ? `${color[0]}${type.toUpperCase()}` : '';
  };

  return (
    <div className='h-screen w-full bg-slate-300 flex justify-center items-center'>
      <div className='h-[85%] w-[80%] bg-green-400 flex flex-col justify-evenly items-center '>
      <Board getSquareColor={getSquareColor} handleDragOver={handleDragOver} handleDrop={handleDrop} renderPiece={renderPiece} board={board}/>
      <div>
        
      </div>
      <div>
        
      </div>
      </div>
    </div>
  );
};

export default Play;
