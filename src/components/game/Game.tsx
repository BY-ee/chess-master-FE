import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from '../../engine/ai';
import { RefreshCw, Trophy, AlertTriangle, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { gameApi } from '../../api/gameApi';
// import { useAuthStore } from '../../store/useAuthStore';

interface GameProps {
    mode: 'ai' | 'online';
    roomId?: string;
}

const Game = ({ mode, roomId }: GameProps) => {
    // Game Logic State
    const [game, setGame] = useState(new Chess());
    
    // View State
    const [history, setHistory] = useState<{ fen: string; san: string }[]>([{ fen: new Chess().fen(), san: '' }]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [gameStatus, setGameStatus] = useState<string>('');
    const [isSaved, setIsSaved] = useState(false);
    
    // Rematch State
    const [rematchRequested, setRematchRequested] = useState(false); // We sent request
    const [rematchIncoming, setRematchIncoming] = useState<{ requestedBy: number; expiresAt: Date } | null>(null); // Opponent sent request
    // const { user } = useAuthStore(); // Removed unused
    
    // User Color State (Randomized on start for AI, determined by server for Online)
    const [userColor, setUserColor] = useState<'w' | 'b'>(() => Math.random() < 0.5 ? 'w' : 'b');

    // Socket
    const socket = useSocket();

    // Refs for keyboard handling to avoid stale closures
    const gameRef = useRef(game);
    const historyRef = useRef(history);
    const indexRef = useRef(currentMoveIndex);
    const userColorRef = useRef(userColor);

    useEffect(() => {
        gameRef.current = game;
        historyRef.current = history;
        indexRef.current = currentMoveIndex;
        userColorRef.current = userColor;
    }, [game, history, currentMoveIndex, userColor]);

    // Check Game Status
    useEffect(() => {
        if (game.isGameOver()) {
            let status = '';
            let result: 'win' | 'loss' | 'draw' = 'draw';
            let winnerColor: 'w' | 'b' | undefined = undefined;

            if (game.isCheckmate()) {
                winnerColor = game.turn() === 'w' ? 'b' : 'w';
                const winnerName = winnerColor === 'w' ? 'White' : 'Black';
                const isUserWinner = userColor === winnerColor;
                status = `Checkmate! ${winnerName} wins! ${isUserWinner ? '(You Win!)' : '(You Lose!)'}`;
                result = isUserWinner ? 'win' : 'loss';
            } else if (game.isDraw()) {
                status = 'Draw!';
                result = 'draw';
            } else {
                status = 'Game Over';
                result = 'draw'; // Fallback
            }
            setGameStatus(status);

            // Save Game Result (AI Mode only - Online handled by server)
            if (mode === 'ai' && !isSaved) {
                const pgn = game.pgn();
                setIsSaved(true);
                gameApi.saveGameResult({
                    mode: 'ai',
                    result,
                    winnerColor,
                    userColor, // Passing the user's color
                    pgn,
                    opponentId: 'ai',
                }).then(() => {
                    console.log('Game saved successfully');
                }).catch((err) => {
                    console.error('Failed to save game', err);
                    setIsSaved(false); // Retry possible?
                });
            } else if (mode === 'online' && socket && roomId && !isSaved) {
                // Determine if WE should report the result. usually both clients might emit, or just the winner, or server detects it.
                // Assuming server trusts client for now or validates moves.
                // Better approach: Server detects checkmate/draw from move stream. 
                // BUT, if we need to explicitly end it:
                
                // Only let one client or both send it, server handles idempotency.
                setIsSaved(true);
                socket.emit('game_end', {
                    roomId,
                    winnerColor, // 'w' | 'b' | undefined
                    pgn: game.pgn()
                });
            }

        } else {
            setGameStatus('');
        }
    }, [game, userColor, mode, isSaved, socket, roomId]);

    // Socket Listeners (Online Mode)
    useEffect(() => {
        if (mode === 'online' && socket && roomId) {
            
            // Join the game room
            console.log(`Joining game room: ${roomId}`);
            socket.emit('join_game', { roomId });

            socket.on('move_made', (move: string) => {
                // Apply opponent's move
                console.log('Received move_made:', move);
                // The server sends the move notation (SAN/UCI) string. 
                // We pass it directly to safeMakeAMove which handles both string and object.
                safeMakeAMove(move);
            });
            
            socket.on('game_ended', (data: { result: '1-0' | '0-1' | '1/2-1/2', saved: boolean }) => {
                // Server confirms game end and save.
                console.log('Game ended event received:', data);
                
                let winner: 'w' | 'b' | 'draw' = 'draw';
                if (data.result === '1-0') winner = 'w';
                else if (data.result === '0-1') winner = 'b';
                
                if (winner === 'draw') {
                     setGameStatus('Game Over - Draw');
                } else {
                     const isUserWinner = winner === userColorRef.current;
                     setGameStatus(isUserWinner ? 'You Win! (Online)' : 'You Lose! (Online)');
                }
                setIsSaved(true); // Stop local logic from trying to save again
            });

            // Rematch Listeners
            socket.on('rematch_requested', (data: { requestedBy: number; expiresAt: Date }) => {
                console.log('Rematch requested:', data);
                setRematchIncoming(data);
            });

            socket.on('game_restarted', (data: { whiteId: number; blackId: number }) => {
                console.log('Game restarted!', data);
                // Reset game locally
                const newGame = new Chess();
                setGame(newGame);
                setHistory([{ fen: newGame.fen(), san: '' }]);
                setCurrentMoveIndex(0);
                setGameStatus('');
                setIsSaved(false);
                setRematchRequested(false);
                setRematchIncoming(null);
            });

            socket.on('game_start', (data: { color: 'w' | 'b', fen?: string, pgn?: string }) => {
                console.log('Game start!', data);
                setUserColor(data.color);
                userColorRef.current = data.color;
                
                if (data.fen || data.pgn) {
                    console.log('Restoring game state from server...');
                    const newGame = new Chess();
                    try {
                        let reconstructedHistory: { fen: string; san: string }[] = [{ fen: new Chess().fen(), san: '' }];

                        if (data.pgn) {
                            newGame.loadPgn(data.pgn);
                            
                            // Reconstruct history array for UI
                            const tempGame = new Chess();
                            const moves = newGame.history({ verbose: true });
                            
                            moves.forEach(move => {
                                tempGame.move(move);
                                reconstructedHistory.push({
                                    fen: tempGame.fen(),
                                    san: move.san
                                });
                            });
                        } else if (data.fen) {
                            newGame.load(data.fen);
                            // If only FEN is provided, we can't reconstruct move history, only final state
                            reconstructedHistory.push({ fen: newGame.fen(), san: '' });
                        }
                        
                        setGame(newGame);
                        setHistory(reconstructedHistory);
                        setCurrentMoveIndex(reconstructedHistory.length - 1);
                    } catch (e) {
                        console.error('Failed to load remote state:', e);
                        resetGame(false);
                    }
                } else {
                    resetGame(false); // Reset but keep color
                }
            });
            
            // Handle join errors or full room
            socket.on('error', (error: any) => {
                console.error('Socket error:', error);
                alert(`Game Error: ${error.message || 'Unknown error'}`);
            });

            return () => {
                socket.off('move_made');
                socket.off('game_start');
                socket.off('game_ended');
                socket.off('rematch_requested');
                socket.off('game_restarted');
                socket.off('error');
                
                // Notify server that we are leaving the room
                console.log(`Leaving game room: ${roomId}`);
                socket.emit('leave_game', { roomId });
            };
        }
    }, [mode, socket, roomId]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                const newIndex = Math.max(0, indexRef.current - 1);
                setCurrentMoveIndex(newIndex);
            } else if (e.key === 'ArrowRight') {
                const newIndex = Math.min(historyRef.current.length - 1, indexRef.current + 1);
                setCurrentMoveIndex(newIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const safeMakeAMove = (move: string | { from: string; to: string; promotion?: string }) => {
        try {
            const gameCopy = new Chess(gameRef.current.fen());
            const result = gameCopy.move(move);
            
            const newHistory = [...historyRef.current.slice(0, indexRef.current + 1), { fen: gameCopy.fen(), san: result.san }];
            
            setGame(gameCopy);
            setHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            
            return result;
        } catch (e) {
            return null;
        }
    };

    // AI Turn Logic
    useEffect(() => {
      if (mode !== 'ai') return;

      // Run AI if it's NOT user's turn, game not over, AND we are viewing the latest move.
      const isLatestMove = currentMoveIndex === history.length - 1;
      const isAiTurn = game.turn() !== userColor;

      if (isAiTurn && !game.isGameOver() && isLatestMove) {
        // Add a small delay for realism
        const timeoutId = setTimeout(() => {
          const aiMove = getBestMove(game);
          if (aiMove) {
            safeMakeAMove(aiMove);
          }
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [game, currentMoveIndex, history, userColor, mode]);

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        // Prevent moves if reviewing past history
        if (currentMoveIndex !== history.length - 1) return false;
        
        // Prevent moves if it's not user's turn or game is over
        if (game.turn() !== userColor || game.isGameOver()) return false;

        const piece = game.get(sourceSquare as any);
        const isPromotion = 
            piece?.type === 'p' && 
            ((userColor === 'w' && sourceSquare[1] === '7' && targetSquare[1] === '8') ||
             (userColor === 'b' && sourceSquare[1] === '2' && targetSquare[1] === '1'));

        const moveData: { from: string; to: string; promotion?: string } = {
            from: sourceSquare,
            to: targetSquare,
        };

        if (isPromotion) {
            moveData.promotion = 'q';
        }

        const move = safeMakeAMove(moveData);

        if (move && mode === 'online' && socket && roomId) {
            console.log('Sending move:', moveData);
            socket.emit('make_move', {
                roomId,
                move: move.san
            });
        }

        return move !== null;
    };

    const resetGame = (randomizeColor = true) => {
        const newGame = new Chess();
        setGame(newGame);
        setHistory([{ fen: newGame.fen(), san: '' }]);
        setCurrentMoveIndex(0);
        setGameStatus('');
        setIsSaved(false);
        if (randomizeColor && mode === 'ai') {
             setUserColor(Math.random() < 0.5 ? 'w' : 'b');
        }
        setRematchRequested(false);
        setRematchIncoming(null);
    };

    const handleRematchRequest = () => {
        if (mode === 'online' && socket && roomId) {
            socket.emit('request_rematch', { roomId });
            setRematchRequested(true);
        }
    };

    const handleAcceptRematch = () => {
        if (mode === 'online' && socket && roomId) {
            socket.emit('accept_rematch', { roomId });
            setRematchIncoming(null); // Clear modal, wait for restart
        }
    };

    const navigateHistory = (direction: 'back' | 'forward') => {
        if (direction === 'back') {
            setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
        } else {
            setCurrentMoveIndex(Math.min(history.length - 1, currentMoveIndex + 1));
        }
    };

    const jumpToMove = (index: number) => {
        setCurrentMoveIndex(index);
    };

    // Helper to format move list pairs
    const getMovePairs = () => {
        const pairs = [];
        // history[0] is initial state. history[1] is White's 1st move. history[2] is Black's 1st move.
        // So move 1. e4 correspond to index 1.
        for (let i = 1; i < history.length; i += 2) {
            pairs.push({
                moveNumber: Math.ceil(i / 2),
                white: history[i],
                black: history[i + 1] || null, // Might not exist if odd number of history
                whiteIndex: i,
                blackIndex: i + 1
            });
        }
        return pairs;
    };

    // Get current generic FEN for display
    // We use the FEN from history based on the current index
    const displayFen = history[currentMoveIndex].fen;

    // Cast to any to avoid strict type checking issues with props
    const ChessboardComponent = Chessboard as any;

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full max-w-6xl mx-auto p-4">
            {/* Left: Game Board Area */}
            <div className="flex flex-col items-center gap-6 w-full max-w-[600px]">
                <div className="w-full flex justify-between items-center glass-panel p-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="font-semibold text-lg">
                            {gameStatus || (game.turn() === userColor ? `Your Turn (${userColor === 'w' ? 'White' : 'Black'})` : (mode === 'ai' ? "AI Thinking..." : "Opponent's Turn"))}
                        </span>
                    </div>
                    <button 
                        onClick={() => resetGame(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-medium"
                    >
                        <RefreshCw size={18} />
                        New Game
                    </button>
                    {mode === 'online' && (
                        <div className="flex gap-2">
                             {/* Small indicators or controls for rematch could go here, but main modal is better */}
                        </div>
                    )}
                </div>

                <div className="w-full aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-zinc-800 relative">
                    <ChessboardComponent 
                        position={displayFen} 
                        onPieceDrop={onDrop}
                        boardOrientation={userColor === 'w' ? 'white' : 'black'}
                        customDarkSquareStyle={{ backgroundColor: '#769656' }}
                        customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                        animationDuration={200}
                        arePiecesDraggable={currentMoveIndex === history.length - 1 && game.turn() === userColor} // Only drag if latest and user turn
                    />
                    
                    {/* Replay Overlay Indicator */}
                    {currentMoveIndex !== history.length - 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                            Replay Mode
                        </div>
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4glass-panel p-2 rounded-xl bg-zinc-800/50">
                    <button 
                        onClick={() => navigateHistory('back')} 
                        disabled={currentMoveIndex === 0}
                        className="p-3 hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-mono text-zinc-400 min-w-[100px] text-center">
                        {currentMoveIndex} / {history.length - 1}
                    </span>
                    <button 
                        onClick={() => navigateHistory('forward')} 
                        disabled={currentMoveIndex === history.length - 1}
                        className="p-3 hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Right: History Sidebar */}
            <div className="w-full lg:w-[300px] h-[600px] glass-panel flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-zinc-800/30">
                    <History size={20} className="text-zinc-400"/>
                    <h3 className="font-bold text-zinc-200">Move History</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {getMovePairs().length === 0 ? (
                        <div className="text-zinc-600 text-center mt-10 italic">No moves yet</div>
                    ) : (
                        getMovePairs().map((pair) => (
                            <div key={pair.moveNumber} className="flex text-sm">
                                <span className="w-10 py-1.5 text-zinc-500 font-mono text-center bg-zinc-900/30 mr-1 rounded">
                                    {pair.moveNumber}.
                                </span>
                                <button 
                                    onClick={() => jumpToMove(pair.whiteIndex)}
                                    className={`flex-1 py-1.5 px-2 text-left rounded transition-colors ${
                                        currentMoveIndex === pair.whiteIndex 
                                            ? 'bg-yellow-500/20 text-yellow-200 font-medium' 
                                            : 'hover:bg-white/5 text-zinc-300'
                                    }`}
                                >
                                    {pair.white.san}
                                </button>
                                {pair.black && (
                                    <button 
                                        onClick={() => jumpToMove(pair.blackIndex)}
                                        className={`flex-1 py-1.5 px-2 text-left rounded transition-colors ml-1 ${
                                            currentMoveIndex === pair.blackIndex 
                                                ? 'bg-yellow-500/20 text-yellow-200 font-medium' 
                                                : 'hover:bg-white/5 text-zinc-300'
                                    }`}
                                    >
                                        {pair.black.san}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Debug Info in Sidebar Bottom */}
                <div className="p-3 text-[10px] font-mono text-zinc-500 border-t border-white/10 break-all bg-black/20">
                    FEN: {displayFen.split(' ')[0]}... <br/>
                    Playing as: {userColor === 'w' ? 'White' : 'Black'} <br/>
                    Mode: {mode}
                </div>
            </div>
            
            {/* Floating Game Over Modal */}
            {gameStatus && (
                <div className="glass-panel p-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-300">
                    {game.isCheckmate() ? <Trophy size={48} className="text-yellow-500" /> : <AlertTriangle size={48} className="text-zinc-400" />}
                    <h2 className="text-2xl font-bold">{gameStatus}</h2>
                    <button 
                        onClick={() => {
                            if (mode === 'online') handleRematchRequest();
                            else resetGame(true);
                        }}
                        disabled={rematchRequested}
                        className={`px-6 py-3 rounded-xl font-bold text-lg transition-transform hover:scale-105 ${
                            rematchRequested ? 'bg-zinc-600 cursor-wait' : 'bg-green-600 hover:bg-green-500'
                        }`}
                    >
                        {mode === 'online' 
                            ? (rematchRequested ? 'Rematch Requested...' : 'Rematch') 
                            : 'Play Again'}
                    </button>
                    {mode === 'online' && (
                        <button 
                             onClick={() => setGameStatus('')} // Just close the modal to view board
                             className="text-zinc-400 hover:text-white text-sm mt-3 underline"
                        >
                            Close Menu (View Board)
                        </button>
                    )}
                </div>
            )}

            {/* Rematch Incoming Modal */}
            {rematchIncoming && (
                <div className="glass-panel p-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-300 border border-yellow-500/50">
                    <Trophy size={48} className="text-yellow-500 animate-pulse" />
                    <h2 className="text-2xl font-bold text-center">Opponent wants a Rematch!</h2>
                    <p className="text-zinc-400">Time remaining: 60s</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleAcceptRematch}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                        >
                            Accept
                        </button>
                        <button 
                            onClick={() => setRematchIncoming(null)}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
