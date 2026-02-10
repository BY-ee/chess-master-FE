import { useMemo, useEffect, useRef } from 'react';
import { History } from 'lucide-react';

interface MoveHistoryProps {
    history: { fen: string; san: string }[];
    currentMoveIndex: number;
    jumpToMove: (index: number) => void;
    userColor: 'w' | 'b';
    mode: string;
    displayFen: string;
}

export const MoveHistory = ({ 
    history, 
    currentMoveIndex, 
    jumpToMove,
    userColor,
    mode,
    displayFen
}: MoveHistoryProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new moves
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history.length, currentMoveIndex]);

    const movePairs = useMemo(() => {
        const pairs = [];
        for (let i = 1; i < history.length; i += 2) {
            pairs.push({
                moveNumber: Math.ceil(i / 2),
                white: history[i],
                black: history[i + 1] || null,
                whiteIndex: i,
                blackIndex: i + 1
            });
        }
        return pairs;
    }, [history]);

    return (
        <div className="w-full lg:w-[300px] h-[600px] glass-panel flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-zinc-800/30">
                <History size={20} className="text-zinc-400"/>
                <h3 className="font-bold text-zinc-200">Move History</h3>
            </div>
            
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
                {movePairs.length === 0 ? (
                    <div className="text-zinc-600 text-center mt-10 italic">No moves yet</div>
                ) : (
                    movePairs.map((pair) => (
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

            {/* Debug Info */}
            <div className="p-3 text-[10px] font-mono text-zinc-500 border-t border-white/10 break-all bg-black/20">
                FEN: {displayFen.split(' ')[0]}... <br/>
                Playing as: {userColor === 'w' ? 'White' : 'Black'} <br/>
                Mode: {mode}
            </div>
        </div>
    );
};
