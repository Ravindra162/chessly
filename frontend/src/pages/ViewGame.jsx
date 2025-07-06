import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Piece from "../assets/Piece";
import Loading from '../components/Loading';
import { Button } from '@nextui-org/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useChessSounds } from '../utils/chessSounds';

const ViewGame = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const gameId = searchParams.get('gameId');
    
    const [board, setBoard] = useState([]);
    const [chess, setChess] = useState(new Chess());
    const [gameData, setGameData] = useState(null);
    const [moves, setMoves] = useState([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [kingInCheck, setKingInCheck] = useState(null);
    const [isCheckmate, setIsCheckmate] = useState(false);
    const [isStalemate, setIsStalemate] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [copyingPgn, setCopyingPgn] = useState(false);

    const chessSounds = useChessSounds();

    // Update sound mute state when toggle changes
    useEffect(() => {
        chessSounds.setMuted(!soundEnabled);
    }, [soundEnabled, chessSounds]);

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

    const getEnvironmentUrl = () => {
        if (import.meta.env.VITE_ENVIRONMENT === 'production') {
            return import.meta.env.VITE_BACKEND_URL || 'https://chessly-backend.vercel.app';
        }
        return 'http://localhost:5000';
    };

    useEffect(() => {
        if (!gameId) {
            setError('No game ID provided');
            setIsLoading(false);
            return;
        }

        const fetchGame = async () => {
            try {
                const response = await axios.get(`${getEnvironmentUrl()}/user/games/${gameId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                    }
                });
                
                const game = response.data.game;
                setGameData(game);
                
                if (game.pgn) {
                    loadPgn(game.pgn);
                } else {
                    setError('No PGN data available for this game');
                }
            } catch (err) {
                console.error('Error fetching game:', err);
                if (err.response?.status === 404) {
                    setError('Game not found or access denied');
                } else {
                    setError('Failed to load game data');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();
    }, [gameId]);

    const loadPgn = (pgn) => {
        try {
            const tempChess = new Chess();
            tempChess.loadPgn(pgn);
            const history = tempChess.history({ verbose: true });
            setMoves(history);
            
            // Reset to starting position
            const startChess = new Chess();
            setChess(startChess);
            setCurrentMoveIndex(-1);
        } catch (err) {
            console.error('Error loading PGN:', err);
            setError('Invalid PGN format');
        }
    };

    const updateGameState = (chessInstance) => {
        setBoard(chessInstance.board());
        
        if (chessInstance.inCheck()) {
            const kingSquare = chessInstance.board().flat().find(square => square && square.type === 'k' && square.color === chessInstance.turn());
            setKingInCheck(kingSquare);
        } else {
            setKingInCheck(null);
        }
        
        setIsCheckmate(chessInstance.isCheckmate());
        setIsStalemate(chessInstance.isStalemate());
    };

    useEffect(() => {
        updateGameState(chess);
    }, [chess]);

    const goToMove = (moveIndex, playSound = true) => {
        const newChess = new Chess();
        
        for (let i = 0; i <= moveIndex; i++) {
            if (moves[i]) {
                newChess.move(moves[i]);
            }
        }
        
        setChess(newChess);
        setCurrentMoveIndex(moveIndex);
        
        // Play sound for the move if requested
        if (playSound && moveIndex >= 0 && moves[moveIndex]) {
            chessSounds.playMoveSound(moves[moveIndex]);
        }
    };

    const handlePrevMove = () => {
        if (currentMoveIndex >= 0) {
            goToMove(currentMoveIndex - 1, true);
        }
    };

    const handleNextMove = () => {
        if (currentMoveIndex < moves.length - 1) {
            goToMove(currentMoveIndex + 1, true);
        }
    };

    const handleGoToStart = () => {
        const newChess = new Chess();
        setChess(newChess);
        setCurrentMoveIndex(-1);
        // No sound for going to start
    };

    const handleGoToEnd = () => {
        if (moves.length > 0) {
            goToMove(moves.length - 1, true);
        }
    };

    const copyPgn = () => {
        if (gameData?.pgn) {
            setCopyingPgn(true);
            navigator.clipboard.writeText(gameData.pgn)
                .then(() => {
                    toast.success("PGN copied to clipboard");
                })
                .catch(err => {
                    console.error('Failed to copy PGN:', err);
                    toast.error("Failed to copy PGN");
                })
                .finally(() => {
                    setCopyingPgn(false);
                });
        }
    };

    const getResultText = () => {
        if (!gameData) return '';
        
        if (gameData.winnerId === null) {
            return 'Draw';
        }
        
        const winnerIsWhite = gameData.whiteUsername && gameData.winnerId;
        // We need to determine if winner was white or black based on the data structure
        // Since we don't have direct winner info, we'll show a generic result
        return 'Game Completed';
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center text-white">
                <div className="text-2xl text-red-500 mb-4">{error}</div>
                <Button 
                    onClick={() => navigate('/home')}
                    className="bg-[#16A34A] hover:bg-[#16A34A]/80 text-white"
                >
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-black from-gray-900 via-green-900 to-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button 
                        onClick={() => navigate('/home')}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        ← Back to Home
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Game Replay</h1>
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Chess Board */}
                    <div className="flex-1 flex flex-col items-center">
                        {/* Game Info */}
                        {gameData && (
                            <div className="bg-[#111] rounded-lg p-4 mb-4 w-full max-w-[500px]">
                                <div className="flex justify-between items-center text-white">
                                    <div className="text-center">
                                        <div className="font-bold">{gameData.whiteUsername}</div>
                                        <div className="text-sm text-gray-400">White</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400">vs</div>
                                        <div className="font-bold text-[#16A34A]">{getResultText()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold">{gameData.blackUsername}</div>
                                        <div className="text-sm text-gray-400">Black</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chess Board */}
                        <div className="relative">
                            <div className="h-[400px] w-[400px] md:h-[500px] md:w-[500px] chess-board grid grid-cols-8 border-2 border-[#16A34A] rounded-lg overflow-hidden">
                                {board.map((row, rowIndex) =>
                                    row.map((square, colIndex) => {
                                        const isKingInCheck = kingInCheck && kingInCheck.square === `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
                                        const squareSize = 'h-[50px] w-[50px] md:h-[62.5px] md:w-[62.5px]';
                                        
                                        return (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`${squareSize} ${(rowIndex + colIndex) % 2 === 0 ? 'bg-green-100' : 'bg-green-800'} ${isKingInCheck ? 'bg-red-500' : ''} flex items-center justify-center`}
                                            >
                                                {square && (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <Piece type={pieceMapper(square)} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            
                            {/* Game Status Overlays */}
                            {isCheckmate && (
                                <div className="absolute inset-0 flex justify-center items-center bg-black/50 rounded-lg">
                                    <div className="text-4xl font-bold text-red-500">Checkmate!</div>
                                </div>
                            )}
                            {isStalemate && (
                                <div className="absolute inset-0 flex justify-center items-center bg-black/50 rounded-lg">
                                    <div className="text-4xl font-bold text-blue-500">Stalemate!</div>
                                </div>
                            )}
                        </div>

                        {/* Move Controls */}
                        <div className="mt-6 space-y-4">
                            <div className="flex justify-center gap-2">
                                <Button 
                                    onClick={handleGoToStart}
                                    disabled={currentMoveIndex < 0}
                                    className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                                >
                                    ⏮ Start
                                </Button>
                                <Button 
                                    onClick={handlePrevMove}
                                    disabled={currentMoveIndex < 0}
                                    className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                                >
                                    ← Previous
                                </Button>
                                <Button 
                                    onClick={handleNextMove}
                                    disabled={currentMoveIndex >= moves.length - 1}
                                    className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                                >
                                    Next →
                                </Button>
                                <Button 
                                    onClick={handleGoToEnd}
                                    disabled={currentMoveIndex >= moves.length - 1}
                                    className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                                >
                                    End ⏭
                                </Button>
                            </div>
                            
                            {/* Sound Toggle */}
                            <div className="flex justify-center">
                                <Button 
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className={`${
                                        soundEnabled 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-gray-600 hover:bg-gray-700'
                                    } text-white`}
                                >
                                    {soundEnabled ? '🔊' : '🔇'} Sound {soundEnabled ? 'On' : 'Off'}
                                </Button>
                            </div>
                            
                            <div className="text-center text-white">
                                Move: {currentMoveIndex + 1} / {moves.length}
                                {currentMoveIndex >= 0 && moves[currentMoveIndex] && (
                                    <div className="text-[#16A34A] font-bold mt-1">
                                        {Math.floor(currentMoveIndex / 2) + 1}.{currentMoveIndex % 2 === 0 ? '' : '..'} {moves[currentMoveIndex].san}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <Button 
                                    onClick={copyPgn}
                                    isLoading={copyingPgn}
                                    disabled={copyingPgn}
                                    className="bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A]"
                                >
                                    {copyingPgn ? 'Copying...' : 'Copy PGN'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Move History Sidebar */}
                    <div className="lg:w-80">
                        <div className="bg-[#111] rounded-lg p-4 h-[600px] overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-4">Move History</h3>
                            <div className="space-y-2">
                                {moves.map((move, index) => {
                                    const moveNumber = Math.floor(index / 2) + 1;
                                    const isWhiteMove = index % 2 === 0;
                                    const isCurrentMove = index === currentMoveIndex;
                                    
                                    return (
                                        <div 
                                            key={index}
                                            onClick={() => goToMove(index, true)}
                                            className={`p-2 rounded cursor-pointer transition-colors ${
                                                isCurrentMove 
                                                    ? 'bg-[#16A34A] text-white' 
                                                    : 'hover:bg-gray-800 text-gray-300'
                                            }`}
                                        >
                                            <span className="font-mono">
                                                {isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`} {move.san}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer theme="dark" />
        </div>
    );
};

export default ViewGame;
