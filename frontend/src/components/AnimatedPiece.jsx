import React from 'react';

const AnimatedPiece = ({ 
  piece, 
  rowIndex, 
  colIndex, 
  isAnimating, 
  animationClass, 
  isDraggable, 
  onDragStart, 
  pieceImages 
}) => {
  if (!piece) return null;
  
  const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
  
  return (
    <img
      src={pieceImages[pieceKey]}
      alt={pieceKey}
      draggable={isDraggable}
      onDragStart={() => onDragStart(piece, rowIndex, colIndex)}
      className={`w-full h-full ${isDraggable ? 'cursor-move' : 'cursor-default'} ${animationClass || ''}`}
      style={{
        transition: isAnimating ? 'none' : 'transform 0.1s ease-in-out',
        userSelect: 'none',
        pointerEvents: isAnimating ? 'none' : 'auto'
      }}
    />
  );
};

export default AnimatedPiece;
