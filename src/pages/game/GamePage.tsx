import { useState } from 'react';
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Game from '../../components/game/Game';
import AiBotSelector from '../../components/game/AiBotSelector';
import { ArrowLeft } from 'lucide-react';

const GamePage = () => {
    const { mode } = useParams<{ mode: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('roomId') || undefined;

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            <header className="p-4 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="font-bold text-xl">Chess Master - {mode === 'online' ? 'Online Match' : 'vs AI'}</h1>
                    <button 
                        onClick={() => navigate('/lobby')}
                        className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700 transition-colors"
                    >
                        Exit Game
                    </button>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden relative">
               <GameWrapper mode={mode as 'ai' | 'online'} roomId={roomId} />
            </main>
        </div>
    );
};

const GameWrapper = ({ mode, roomId }: { mode: 'ai' | 'online'; roomId?: string }) => {
    const [selectedBot, setSelectedBot] = useState<import('../../components/game/AiBotSelector').AiModel | null>(null);

    // If online, just render Game
    if (mode === 'online') {
        return <Game mode="online" roomId={roomId} />;
    }

    // If AI, check if bot selected
    if (!selectedBot) {
        return <AiBotSelector onSelect={setSelectedBot} />;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-none p-4 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                <button 
                    onClick={() => setSelectedBot(null)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Change Opponent
                </button>
                <div className="text-sm text-zinc-500">
                    Playing vs <span className="text-zinc-300 font-semibold">{selectedBot.name}</span> ({selectedBot.rating})
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <Game mode="ai" aiModel={selectedBot} />
            </div>
        </div>
    );
};

export default GamePage;
