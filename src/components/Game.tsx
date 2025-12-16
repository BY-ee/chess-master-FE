import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from '../engine/ai';
import { RefreshCw, Trophy, AlertTriangle } from 'lucide-react';

const Game = () => {
    const [game, setGame] = useState(new Chess());
    const [gameStatus, setGameStatus] = useState<string>('');

    useEffect(() => {
        if (game.isGameOver()) {
            if (game.isCheckmate()) {
                setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
            } else if (game.isDraw()) {
                setGameStatus('Draw!');
            } else {
                setGameStatus('Game Over');
            }
            return;
        }

        setGameStatus('');

        // AI Turn Logic
        if (game.turn() === 'b') {
            const timer = setTimeout(() => {
                const aiMove = getBestMove(game);
                if (aiMove) {
                    console.log("[DEBUG] AI Move:", aiMove);
                    makeAMove(aiMove);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [game]);

    const makeAMove = (move: string | { from: string; to: string; promotion?: string }) => {
        try {
            const gameCopy = new Chess(game.fen());
            const result = gameCopy.move(move);
            setGame(gameCopy);
            return result;
        } catch (e) {
            return null;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        console.log(`[DEBUG] onDrop called: ${sourceSquare} -> ${targetSquare}`);

        if (game.turn() !== 'w' || game.isGameOver()) {
            console.warn("[DEBUG] Move rejected: Not White's turn or Game Over");
            return false;
        }

        // Only add promotion if it's a pawn moving to the last rank
        const piece = game.get(sourceSquare as any);
        const isPromotion =
            piece?.type === 'p' &&
            sourceSquare[1] === '7' &&
            targetSquare[1] === '8';

        const moveData: { from: string; to: string; promotion?: string } = {
            from: sourceSquare,
            to: targetSquare,
        };

        if (isPromotion) {
            moveData.promotion = 'q';
        }

        console.log("[DEBUG] Attempting move with data:", moveData);

        const move = makeAMove(moveData);

        if (move === null) {
            console.error("[DEBUG] Move failed (Illegal) in chess.js:", moveData);
            return false;
        }

        console.log("[DEBUG] Move successful:", move);
        return true;
    };

    const resetGame = () => {
        setGame(new Chess());
        setGameStatus('');
    };

    // Cast to any to avoid strict type checking issues with props
    const ChessboardComponent = Chessboard as any;

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
            <div className="w-full flex justify-between items-center glass-panel p-4">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="font-semibold text-lg">
                        {gameStatus || (game.turn() === 'w' ? "Your Turn (White)" : "AI Thinking...")}
                    </span>
                </div>
                <button
                    onClick={resetGame}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-medium"
                >
                    <RefreshCw size={18} />
                    New Game
                </button>
            </div>

            <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-zinc-800 relative z-10">
                <ChessboardComponent
                    id="BasicBoard"
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    customDarkSquareStyle={{ backgroundColor: '#769656' }}
                    customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                    animationDuration={200}
                />
            </div>

            {/* Debug Info Panel */}
            <div className="glass-panel p-4 text-xs font-mono text-zinc-400 w-full break-all">
                <p><strong>DEBUG INFO:</strong></p>
                <p>Turn: {game.turn()}</p>
                <p>FEN: {game.fen()}</p>
                <p>Game Over: {game.isGameOver() ? 'Yes' : 'No'}</p>
            </div>

            {gameStatus && (
                <div className="glass-panel p-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-300">
                    {game.isCheckmate() ? <Trophy size={48} className="text-yellow-500" /> : <AlertTriangle size={48} className="text-zinc-400" />}
                    <h2 className="text-2xl font-bold">{gameStatus}</h2>
                    <button
                        onClick={resetGame}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default Game;
