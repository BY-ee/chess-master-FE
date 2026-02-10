import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { BOARD_THEME, ANIMATION_DURATION } from './constants';

interface GameBoardProps {
    game: Chess;
    userColor: 'w' | 'b';
    mode: 'ai' | 'online';
    isWaitingForOpponent: boolean;
    isRoomVerified: boolean;
    opponent: { username: string; rating?: number } | null;
    currentMoveIndex: number;
    historyLength: number;
    isSaved: boolean;
    gameStatus: string;
    displayFen: string;
    onDrop: (sourceSquare: string, targetSquare: string) => boolean;
}

export const GameBoard = ({
    game,
    userColor,
    mode,
    isWaitingForOpponent,
    isRoomVerified,
    opponent,
    currentMoveIndex,
    historyLength,
    isSaved,
    gameStatus,
    displayFen,
    onDrop
}: GameBoardProps) => {
    // Cast to any to avoid strict type checking issues with props
    const ChessboardComponent = Chessboard as any;

    const arePiecesDraggable = !isWaitingForOpponent && 
        (mode === 'ai' || Boolean(opponent)) && 
        currentMoveIndex === historyLength - 1 && 
        game.turn() === userColor && 
        !game.isGameOver() && 
        !isSaved;

    return (
        <div className="w-full aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-zinc-800 relative">
            {/* Pre-validation Loading for Online Mode */}
            {mode === 'online' && !isRoomVerified ? (
                <div className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <h3 className="text-xl font-bold animate-pulse">Connecting to Room...</h3>
                    <p className="text-zinc-500 text-sm mt-2">Verifying room status</p>
                </div>
            ) : (
                <ChessboardComponent 
                    position={displayFen} 
                    onPieceDrop={onDrop}
                    boardOrientation={userColor === 'w' ? 'white' : 'black'}
                    customDarkSquareStyle={BOARD_THEME.dark}
                    customLightSquareStyle={BOARD_THEME.light}
                    animationDuration={ANIMATION_DURATION}
                    arePiecesDraggable={arePiecesDraggable}
                />
            )}
            
            {/* Waiting For Opponent Overlay (Only show if Verified and Waiting) */}
            {isRoomVerified && isWaitingForOpponent && !gameStatus && !isSaved && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <h3 className="text-xl font-bold">Waiting for opponent...</h3>
                    <p className="text-zinc-300 text-sm mt-2">The game will start when both players connect.</p>
                </div>
            )}
            
            {/* Replay Overlay Indicator */}
            {currentMoveIndex !== historyLength - 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    Replay Mode
                </div>
            )}
        </div>
    );
};
