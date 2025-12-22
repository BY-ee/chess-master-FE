import { useNavigate } from 'react-router-dom';

const LobbyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Lobby</h1>
                    <button className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600">Logout</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Game Modes */}
                    <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Play</h2>
                        <div className="space-y-4">
                            <button 
                                onClick={() => navigate('/game/ai')}
                                className="w-full p-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-left transition-colors flex items-center justify-between"
                            >
                                <span>Play vs AI</span>
                                <span className="text-zinc-400 text-sm">Practice Mode</span>
                            </button>
                            <button 
                                onClick={() => navigate('/game/online')}
                                className="w-full p-4 bg-green-700 hover:bg-green-600 rounded-lg text-left transition-colors flex items-center justify-between"
                            >
                                <span>Find Match</span>
                                <span className="text-zinc-200 text-sm">Online</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Games / Leaderboard Skeleton */}
                    <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Online Players</h2>
                        <div className="space-y-2 text-zinc-400">
                            <p>Connecting to server...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LobbyPage;
