import { Trophy, AlertTriangle, RefreshCw } from 'lucide-react';
import type { RatingChanges } from './types';

interface GameResultModalProps {
    gameStatus: string;
    isCheckmate: boolean;
    mode: 'ai' | 'online';
    rematchRequested: boolean;
    isRematchDisabled: boolean;
    isRematchExpired: boolean;
    rematchCooldown: number;
    rotation?: 'w' | 'b';
    ratingChanges?: RatingChanges | null;
    onRematch: () => void;
    onCancelRematch: () => void;
    onNewGame: () => void;
    onFindNewOpponent: () => void;
    onClose: () => void;
}

export const GameResultModal = ({
    gameStatus,
    isCheckmate,
    mode,
    rematchRequested,
    isRematchDisabled,
    isRematchExpired,
    rematchCooldown,
    rotation = 'w',
    ratingChanges,
    onRematch,
    onCancelRematch,
    onNewGame,
    onFindNewOpponent,
    onClose
}: GameResultModalProps) => {
    if (!gameStatus) return null;

    const handleRematchClick = () => {
        if (mode === 'online') {
            if (rematchRequested) onCancelRematch();
            else onRematch();
        } else {
            onNewGame();
        }
    };

    const userRatingChange = ratingChanges ? ratingChanges[rotation === 'w' ? 'white' : 'black'] : null;
    const ratingDiff = userRatingChange ? userRatingChange.new - userRatingChange.old : 0;
    const diffSign = ratingDiff >= 0 ? '+' : '';

    return (
        <div className="glass-panel p-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-300">
            {isCheckmate ? <Trophy size={48} className="text-yellow-500" /> : <AlertTriangle size={48} className="text-zinc-400" />}
            <h2 className="text-2xl font-bold">{gameStatus}</h2>
            
            {userRatingChange && (
                <div className="flex flex-col items-center bg-zinc-800/50 p-3 rounded-lg w-full mb-2">
                    <span className="text-zinc-400 text-sm uppercase font-bold tracking-wider">Rating Update</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-400 text-lg">{userRatingChange.old}</span>
                        <span className="text-zinc-600">→</span>
                        <span className={`text-xl font-bold ${ratingDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {userRatingChange.new}
                        </span>
                        <span className={`text-sm font-medium ml-1 ${ratingDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ({diffSign}{ratingDiff})
                        </span>
                    </div>
                </div>
            )}

            <button 
                onClick={handleRematchClick}
                disabled={isRematchDisabled || isRematchExpired || rematchCooldown > 0}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-transform hover:scale-105 ${
                    isRematchDisabled || isRematchExpired || rematchCooldown > 0
                        ? 'bg-zinc-700 cursor-not-allowed opacity-50' 
                        : rematchRequested ? 'bg-zinc-600 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'
                }`}
            >
                {mode === 'online' 
                    ? (isRematchExpired
                        ? 'Room Expired'
                        : isRematchDisabled 
                            ? 'Rematch Declined' 
                            : rematchCooldown > 0
                                ? `Wait ${rematchCooldown}s`
                                : rematchRequested ? 'Cancel Request' : 'Rematch') 
                    : 'Play Again'}
            </button>

            {mode === 'online' && (
                <div className="flex flex-col items-center gap-2 mt-2 w-full">
                    <button
                        onClick={onFindNewOpponent}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Find New Opponent
                    </button>
                    <button 
                         onClick={onClose}
                         className="text-zinc-400 hover:text-white text-sm mt-1 underline"
                    >
                        Close Menu (View Board)
                    </button>
                </div>
            )}
        </div>
    );
};
