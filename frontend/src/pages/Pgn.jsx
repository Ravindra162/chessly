import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import Piece from "../assets/Piece";

const Pgn = () => {
    const [board, setBoard] = useState([]);
    const [chess, setChess] = useState(new Chess());
    const [draggedPiece, setDraggedPiece] = useState(null);
    const [draggedFrom, setDraggedFrom] = useState(null);
    const [kingInCheck, setKingInCheck] = useState(null);
    const [isCheckmate, setIsCheckmate] = useState(false);
    const [isStalemate, setIsStalemate] = useState(false);
    const [moves, setMoves] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [pgnInput, setPgnInput] = useState('');

    const pieceMapper = (piece) => {
        const pieceMap = {
            p: 'Pawn',
            r: 'Rook',
            n: 'Night',
            b: 'Bishop',
            q: 'Queen',
            k: 'King'
        };
        return pieceMap[piece.type] ? `${piece.color === 'w' ? 'w' : 'b'}${pieceMap[piece.type][0]}` : '';
    };

    useEffect(() => {
        setBoard(chess.board());
        if (chess.inCheck()) {
            const kingSquare = chess.board().flat().find(square => square && square.type === 'k' && square.color === chess.turn());
            setKingInCheck(kingSquare);
        } else {
            setKingInCheck(null);
        }
        setIsCheckmate(chess.isCheckmate());
        setIsStalemate(chess.isStalemate());
    }, [chess]);

    const handleDragStart = (piece, rowIndex, colIndex) => {
        setDraggedPiece(piece);
        setDraggedFrom({ rowIndex, colIndex });
    };

    const handleDrop = (rowIndex, colIndex) => {
        if (draggedPiece && draggedFrom) {
            const from = `${String.fromCharCode(97 + draggedFrom.colIndex)}${8 - draggedFrom.rowIndex}`;
            const to = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            const newChess = new Chess(chess.fen());
            const move = newChess.move({ from, to });

            if (move) {
                setChess(newChess);
                setBoard(newChess.board());
                setMoves([...moves.slice(0, currentMoveIndex + 1), move.san]);
                setCurrentMoveIndex(currentMoveIndex + 1);
            }
        }
        setDraggedPiece(null);
        setDraggedFrom(null);
    };

    const handlePgnInput = (event) => {
        setPgnInput(event.target.value);
    };

    const handlePgnSubmit = (event) => {
        event.preventDefault();
        const newChess = new Chess();
        if (newChess.loadPgn(pgnInput)) {
            setChess(newChess);
            setMoves(newChess.history());
            setCurrentMoveIndex(newChess.history().length - 1);
            setBoard(newChess.board());
        } else {
            alert('Invalid PGN. Please enter a valid PGN string.');
        }
    };

    const handleNextMove = () => {
        if (currentMoveIndex < moves.length - 1) {
            const newIndex = currentMoveIndex + 1;
            const newChess = new Chess();
            newChess.loadPgn(moves.slice(0, newIndex + 1).join(' '));
            setChess(newChess);
            setCurrentMoveIndex(newIndex);
        }
    };

    const handlePrevMove = () => {
        if (currentMoveIndex > 0) {
            const newIndex = currentMoveIndex - 1;
            const newChess = new Chess();
            newChess.loadPgn(moves.slice(0, newIndex + 1).join(' '));
            setChess(newChess);
            setCurrentMoveIndex(newIndex);
        } else if (currentMoveIndex === 0) {
            setChess(new Chess());
            setCurrentMoveIndex(-1);
        }
    };

    return (
        <div className='h-screen w-full flex flex-col items-center'>
            <div className="h-[800px] w-[800px] chess-board grid grid-cols-8">
                {board.map((row, rowIndex) =>
                    row.map((square, colIndex) => {
                        const isKingInCheck = kingInCheck && kingInCheck.square === `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`h-[100px] w-[100px] ${(rowIndex + colIndex) % 2 === 0 ? 'bg-green-700' : 'bg-white'} ${isKingInCheck ? 'bg-red-500' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(rowIndex, colIndex)}
                            >
                                {square && (
                                    <div
                                        draggable
                                        onDragStart={() => handleDragStart(square, rowIndex, colIndex)}
                                    >
                                        <Piece type={pieceMapper(square)} />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            {isCheckmate && <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center text-4xl text-red-500">check_mate</div>}
            {isStalemate && <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center text-4xl text-blue-500">draw due to stalemate</div>}
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={handlePrevMove} 
                    className="p-2 bg-gray-500 text-white rounded"
                >
                    Previous
                </button>
                <button 
                    onClick={handleNextMove} 
                    className="p-2 bg-gray-500 text-white rounded"
                >
                    Next
                </button>
            </div>
            <form onSubmit={handlePgnSubmit} className="mt-4">
                <input 
                    type="text" 
                    value={pgnInput} 
                    onChange={handlePgnInput} 
                    placeholder="Paste PGN here and press Enter" 
                    className="p-2 border rounded"
                />
                <button type="submit" className="p-2 bg-blue-500 text-white rounded ml-2">
                    Start Analysis
                </button>
            </form>
        </div>
    );
};

export default Pgn;
