import React from 'react'




function Board({getSquareColor,handleDragOver,handleDrop, renderPiece, board}) {
  return <div className='chess-board  h-[640px] w-[640px] flex flex-wrap'>
  {board != null ? (
    board.map((row, rowIndex) => (
      row.map((col, colIndex) => (
        <div 
          key={`${rowIndex}-${colIndex}`} 
          className={`h-[80px] w-[80px] ${getSquareColor(rowIndex, colIndex)} flex justify-center items-center`}
          onDrop={() => handleDrop(rowIndex, colIndex)}
          onDragOver={handleDragOver}
        >
          {renderPiece(col, rowIndex, colIndex)}
        </div>
      ))
    ))
  ) : (
    <div className='flex justify-center items-center h-full w-full'>
      <h2 className="text-2xl">Please wait Matchmaking started...</h2>
    </div>
  )}
</div>
}

export default Board