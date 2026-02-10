import { RefreshCw } from 'lucide-react';
import { Chess } from 'chess.js';
import { type AiModel } from './AiBotSelector';

interface GameInfoProps {
    game: Chess;
    userColor: 'w' | 'b';
    mode: 'ai' | 'online';
    gameStatus: string;
    aiModel?: AiModel;
    opponent: { username: string; rating?: number } | null;
    onReset: () => void;
}

export const GameInfo = ({
    game,
    userColor,
    mode,
    gameStatus,
    aiModel,
    opponent,
    onReset
}: GameInfoProps) => {
    return (
        <div className="w-full flex justify-between items-center glass-panel p-4">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-green-500' : 'bg-gray-500'}`} />
                     <span className="font-semibold text-lg">
                        {gameStatus || (game.turn() === userColor ? `Your Turn (${userColor === 'w' ? 'White' : 'Black'})` : (mode === 'ai' ? "AI Thinking..." : "Opponent's Turn"))}
                    </span>
                </div>
                {mode === 'ai' && aiModel && (
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden relative border border-zinc-600">
                             {!aiModel.name ? <div className="w-full h-full bg-zinc-600" /> : null}
                             <img 
                                src={aiModel.imageUrl}
                                alt={aiModel.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                             />
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <span className="font-medium text-zinc-300">Vs: {aiModel.name}</span>
                            <span className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 font-mono">{aiModel.rating}</span>
                            <span className={`text-[10px] uppercase border px-1 rounded ${
                                aiModel.type === 'aggressive' ? 'border-red-500/30 text-red-400' :
                                aiModel.type === 'defensive' ? 'border-blue-500/30 text-blue-400' :
                                'border-green-500/30 text-green-400'
                            }`}>{aiModel.type}</span>
                        </div>
                    </div>
                )}

                {mode === 'online' && (
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/50 overflow-hidden relative border border-indigo-500/30 flex items-center justify-center">
                             {opponent ? (
                                <span className="text-xs font-bold text-indigo-200">
                                    {opponent.username.substring(0, 2).toUpperCase()}
                                </span>
                             ) : (
                                 <div className="w-full h-full bg-zinc-700 animate-pulse" />
                             )}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <span className="font-medium text-zinc-300">
                                {opponent ? `Vs: ${opponent.username}` : 'Waiting for opponent...'}
                            </span>
                            {opponent?.rating && (
                                <span className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
                                    {opponent.rating}
                                </span>
                            )}
                            {opponent && (
                                <span className="text-[10px] uppercase border border-indigo-500/30 text-indigo-400 px-1 rounded">
                                    Online
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {mode === 'ai' && (
                <button 
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-medium text-sm"
                >
                    <RefreshCw size={16} />
                    New Game
                </button>
            )}
        </div>
    );
};
