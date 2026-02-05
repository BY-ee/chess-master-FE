import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { ArrowLeft, Users, Clock } from 'lucide-react';

const MatchmakingPage = () => {
    const navigate = useNavigate();
    const { 
        status, 
        elapsedTime, 
        queuePosition,
        estimatedWait,
        isSearching,
        startMatchmaking, 
        cancelMatchmaking,
        isConnected
    } = useMatchmaking();

    // Auto-start matchmaking when connected
    useEffect(() => {
        if (isConnected) {
            startMatchmaking();
        }
    }, [isConnected, startMatchmaking]);

    const handleCancel = () => {
        cancelMatchmaking();
        navigate('/lobby');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                {/* Main Card */}
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-zinc-700/50 p-8 relative overflow-hidden">
                    {/* Animated Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-pulse"></div>
                    
                    <div className="relative z-10">
                        {/* Status Icon */}
                        <div className="flex justify-center mb-6">
                            {isSearching ? (
                                <div className="relative">
                                    {/* Pulsing Rings */}
                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                                    <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                    
                                    {/* Center Icon */}
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                                        <Users className="w-12 h-12 text-white animate-bounce" />
                                    </div>
                                </div>
                            ) : status === 'timeout' ? (
                                <div className="w-24 h-24 rounded-full bg-yellow-600/20 border-4 border-yellow-500 flex items-center justify-center">
                                    <Clock className="w-12 h-12 text-yellow-500" />
                                </div>
                            ) : status === 'error' ? (
                                <div className="w-24 h-24 rounded-full bg-red-600/20 border-4 border-red-500 flex items-center justify-center">
                                    <Users className="w-12 h-12 text-red-500" />
                                </div>
                            ) : null}
                        </div>

                        {/* Status Text */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">
                                {isSearching && (
                                    <>
                                        Finding Opponent
                                        <span className="inline-block animate-pulse">.</span>
                                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                                    </>
                                )}
                                {status === 'timeout' && 'No Match Found'}
                                {status === 'error' && 'Connection Error'}
                            </h1>
                            
                            <p className="text-zinc-400">
                                {isSearching && 'Searching for a player at your level'}
                                {status === 'timeout' && 'No opponents available right now'}
                                {status === 'error' && 'Lost connection to matchmaking server'}
                            </p>
                        </div>

                        {/* Stats Display */}
                        {isSearching && (
                            <div className="bg-zinc-900/50 rounded-xl p-4 mb-6 space-y-3">
                                {/* Elapsed Time */}
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Search Time
                                    </span>
                                    <span className="font-mono text-lg font-semibold text-blue-400">
                                        {formatTime(elapsedTime)}
                                    </span>
                                </div>

                                {/* Queue Position (if available) */}
                                {queuePosition !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">Queue Position</span>
                                        <span className="font-mono text-lg font-semibold text-purple-400">
                                            #{queuePosition}
                                        </span>
                                    </div>
                                )}

                                {/* Estimated Wait (if available) */}
                                {estimatedWait !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">Estimated Wait</span>
                                        <span className="font-mono text-lg font-semibold text-green-400">
                                            ~{Math.ceil(estimatedWait / 60)}m
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {isSearching ? (
                                <button
                                    onClick={handleCancel}
                                    className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20"
                                >
                                    Cancel Search
                                </button>
                            ) : (
                                <>
                                    {status === 'timeout' && (
                                        <button
                                            onClick={startMatchmaking}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                                        >
                                            Try Again
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate('/lobby')}
                                        className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        Back to Lobby
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Helpful Tip */}
                        {isSearching && (
                            <p className="text-zinc-500 text-xs text-center mt-6">
                                💡 Tip: You can cancel anytime and return to the lobby
                            </p>
                        )}
                    </div>
                </div>

                {/* Alternative Options */}
                {!isSearching && (
                    <div className="mt-6 text-center">
                        <p className="text-zinc-500 text-sm mb-3">Or explore other options:</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => navigate('/rooms')}
                                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-sm transition-colors border border-zinc-700/50"
                            >
                                Browse Rooms
                            </button>
                            <button
                                onClick={() => navigate('/game/ai')}
                                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-sm transition-colors border border-zinc-700/50"
                            >
                                Play vs AI
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchmakingPage;
