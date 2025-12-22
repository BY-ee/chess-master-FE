import { useParams } from 'react-router-dom';
import Game from '../../components/game/Game';

const GamePage = () => {
    const { mode } = useParams<{ mode: string }>();

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            <header className="p-4 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="font-bold text-xl">Chess Master - {mode === 'online' ? 'Online Match' : 'vs AI'}</h1>
                    <button className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700">Exit Game</button>
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden relative">
               <Game mode={mode as 'ai' | 'online'} />
            </main>
        </div>
    );
};

export default GamePage;
