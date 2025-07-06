import React from 'react';

const Box = ({ bgColor, type, color, x, y, updatePiecePosition, board }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const [sourceX, sourceY] = e.dataTransfer.getData('piecePosition').split(',').map(Number);
    updatePiecePosition(sourceX, sourceY, x, y);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('piecePosition', `${x},${y}`);
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className={`box h-[100px] w-[100px] flex justify-center items-center`}
      style={{ backgroundColor: bgColor }}
      onDrop={handleDrop}
      onDragOver={allowDrop}
    >
      {type && (
        <div
          draggable
          onDragStart={handleDragStart}
          className={`piece ${color}`}
          style={{ fontSize: '2rem' }}
        >
          {renderPiece(type, color)}
        </div>
      )}
    </div>
  );
};

const renderPiece = (type, color) => {
  const pieces = {
    p: '♙', // Pawn
    r: '♖', // Rook
    n: '♘', // Knight
    b: '♗', // Bishop
    q: '♕', // Queen
    k: '♔', // King
  };

  return color === 'black' ? pieces[type].toLowerCase() : pieces[type];
};

export default Box;
