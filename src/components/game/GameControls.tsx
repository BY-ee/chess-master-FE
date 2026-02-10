interface GameControlsProps {
    mode: 'ai' | 'online';
    gameStatus: string;
    isSaved: boolean;
    onResign: () => void;
    onOfferDraw: () => void;
}

export const GameControls = ({ mode, gameStatus, isSaved, onResign, onOfferDraw }: GameControlsProps) => {
    if (mode !== 'online' || gameStatus || isSaved) return null;
    
    return (
        <div className="p-3 border-t border-white/10 flex gap-2">
            <button 
                onClick={onOfferDraw}
                className="flex-1 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs font-semibold text-zinc-300 transition-colors"
                aria-label="Offer Draw"
            >
                Offer Draw
            </button>
            <button 
                onClick={onResign}
                className="flex-1 py-2 rounded-lg bg-red-900/50 hover:bg-red-800/50 text-xs font-semibold text-red-400 transition-colors"
                aria-label="Resign"
            >
                Resign
            </button>
        </div>
    );
};
