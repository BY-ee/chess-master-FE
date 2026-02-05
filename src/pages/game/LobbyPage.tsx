import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';
import { gameApi } from '../../api/gameApi';
import { Plus, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRooms } from '../../hooks/useRooms';
import { RoomItem } from '../../components/game/RoomItem';

const LobbyPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    
    // Use custom hook for room management
    const {
        isConnected,
        onlinePlayers,
        rooms,
        activeGames,
        isLoadingRooms,
        searchTerm,
        hasMore,
        setSearchTerm,
        loadRooms,
        getRelativeTime,
    } = useRooms({ enableOnlineCount: true });
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [createRoomError, setCreateRoomError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateRoom = async () => {
        if (!roomName.trim()) return;
        setIsCreating(true);
        try {
            const room = await gameApi.createRoom(roomName);
            console.log('Room created:', room);
            setShowCreateModal(false);
            setRoomName('');
            // Navigate to game with room ID
            navigate(`/game/online?roomId=${room.roomId}`);

        } catch (error: any) {
            console.error('Failed to create room:', error);
            const status = error.response?.status;
            const errCode = error.response?.data?.error; // Assuming standard backend error structure

            if (status === 409 || errCode === 'ROOM_NAME_CONFLICT') {
                setCreateRoomError('This room name is already taken.');
            } else {
                toast.error('Failed to create room. Please try again.');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        try {
            await gameApi.joinRoom(roomId);
            navigate(`/game/online?roomId=${roomId}`);

        } catch (error) {
            console.error('Failed to join room:', error);
            toast.error('Failed to join room. It may be full or no longer available.');
            loadRooms();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Derived state: Filter active games from available rooms to prevent duplicates
    const displayedRooms = rooms.filter(room => !activeGames.find(ag => ag.roomId === room.roomId));



    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Chess Lobby
                        </h1>
                        {user && <span className="text-zinc-400">Welcome, <span className="text-white font-semibold">{user.username}</span></span>}
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-5 py-2 bg-zinc-700/50 backdrop-blur-sm rounded-lg hover:bg-zinc-600/50 transition-all duration-200 border border-zinc-600/30"
                    >
                        Logout
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                         
                        {/* My Active Games (Rejoin) */}
                        {activeGames.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-900/80 to-blue-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-blue-500/30 animate-in slide-in-from-left duration-300">
                                <h3 className="text-lg font-bold mb-3 text-blue-100 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-300" />
                                    Active Games ({activeGames.length})
                                </h3>
                                <p className="text-sm text-blue-200 mb-4">You have ongoing games.</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {activeGames.map(game => (
                                        <button 
                                            key={game.roomId}
                                            onClick={() => navigate(`/game/online?roomId=${game.roomId}`)}
                                            className="w-full py-2 px-3 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded-lg text-left transition-all flex items-center justify-between group"
                                        >
                                            <span className="text-sm font-medium text-blue-100 truncate flex-1">{game.roomName}</span>
                                            <span className="text-xs text-blue-300 group-hover:text-white transition-colors">Rejoin</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-zinc-700/50">
                            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-400" />
                                Quick Play
                            </h2>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => navigate('/game/ai')}
                                    className="w-full p-4 bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 rounded-xl text-left transition-all duration-200 flex items-center justify-between group shadow-lg"
                                >
                                    <span className="font-medium">Play vs AI</span>
                                    <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">Practice</span>
                                </button>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-left transition-all duration-200 flex items-center justify-between group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!isConnected}
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        Create Room
                                    </span>
                                    <span className="text-emerald-100 text-sm">Host</span>
                                </button>
                            </div>
                        </div>

                        {/* Connection Status */}
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-zinc-700/50">
                            <h3 className="text-lg font-semibold mb-3">Server Status</h3>
                            {isConnected ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full absolute inset-0 animate-ping"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-green-400">Connected</p>
                                        {onlinePlayers > 0 && (
                                            <p className="text-sm text-zinc-400">
                                                {onlinePlayers} player{onlinePlayers !== 1 ? 's' : ''} online
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <p className="text-yellow-400">Connecting...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Available Rooms */}
                    <div className="lg:col-span-2">
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-zinc-700/50 h-full flex flex-col">
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="whitespace-nowrap">Available Rooms</span>
                                </h2>

                                <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                                    {/* Search Bar */}
                                    <div className="relative flex-1">
                                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {/* Reuse Users icon or similar since we haven't imported Search yet. 
                                                Wait, 'Plus', 'Users', 'Clock' are imported. Let's fix imports first. 
                                                Wait, I can replace content. I will use 'Users' temporarily if Search is missing, 
                                                BUT I should import Search properly in the imports section. 
                                                I am replacing the whole block, I cannot easily change the top import here.
                                                Actually, I can just use a text placeholder or SVG if needed, but better to just use standard input styles.
                                            */}
                                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search rooms..."
                                            className="w-full pl-10 pr-4 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-zinc-100 placeholder-zinc-500"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={() => loadRooms(false)}
                                        disabled={isLoadingRooms || !isConnected}
                                        className="px-4 py-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-600/50 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
                                {!isConnected ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>Connect to server to view rooms</p>
                                    </div>
                                ) : isLoadingRooms ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-zinc-700/30 rounded-xl p-4 animate-pulse">
                                                <div className="h-5 bg-zinc-600/50 rounded w-3/4 mb-2"></div>
                                                <div className="h-4 bg-zinc-600/50 rounded w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : displayedRooms.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="mb-2">
                                            {searchTerm ? 'No rooms match your search' : 'No available rooms'}
                                        </p>
                                        {!searchTerm && <p className="text-sm">Create one to start playing!</p>}
                                    </div>
                                ) : (
                                    <>
                                        {displayedRooms.map((room) => (
                                            <RoomItem 
                                                key={room.roomId} 
                                                room={room} 
                                                onJoin={handleJoinRoom} 
                                                getRelativeTime={getRelativeTime} 
                                            />
                                        ))}

                                        {hasMore && (
                                            <button 
                                                onClick={() => navigate('/rooms')}
                                                className="w-full py-3 mt-4 bg-zinc-700/30 hover:bg-zinc-700/50 text-blue-400 hover:text-blue-300 rounded-xl transition-all text-sm font-medium border border-dashed border-zinc-600/50 flex items-center justify-center gap-2 group"
                                            >
                                                <span>View All Rooms</span>
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-zinc-700 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Create New Room
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">
                                    Room Name
                                </label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => {
                                        setRoomName(e.target.value);
                                        if (createRoomError) setCreateRoomError(null);
                                    }}
                                    placeholder="Enter room name..."
                                    className={`w-full px-4 py-3 bg-zinc-700/50 border ${createRoomError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-600 focus:ring-blue-500'} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                                />
                                {createRoomError && (
                                    <p className="text-red-400 text-sm mt-2 animate-in slide-in-from-top-1 px-1">
                                        {createRoomError}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setRoomName('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-medium"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={!roomName.trim() || isCreating}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LobbyPage;
