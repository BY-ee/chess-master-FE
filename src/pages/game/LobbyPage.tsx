import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import { gameApi } from '../../api/gameApi';
import { Plus, Users, Clock } from 'lucide-react';

interface Room {
    roomId: string;
    roomName: string;
    hostUsername: string;
    createdAt: string;
}

const LobbyPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const socket = useSocket();
    
    const [isConnected, setIsConnected] = useState(false);
    const [onlinePlayers, setOnlinePlayers] = useState(0);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setIsConnected(true);
            console.log('Socket connected to lobby');
            loadRooms();
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            console.log('Socket disconnected from lobby');
        };

        const handleOnlineCount = (count: number) => {
            setOnlinePlayers(count);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('online_count', handleOnlineCount);

        if (socket.connected) {
            setIsConnected(true);
            loadRooms();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('online_count', handleOnlineCount);
        };
    }, [socket]);

    const loadRooms = async () => {
        if (!isConnected) return;
        setIsLoadingRooms(true);
        try {
            const roomList = await gameApi.getRooms();
            setRooms(roomList);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setIsLoadingRooms(false);
        }
    };

    const handleCreateRoom = async () => {
        if (!roomName.trim()) return;
        setIsCreating(true);
        try {
            const room = await gameApi.createRoom();
            console.log('Room created:', room);
            setShowCreateModal(false);
            setRoomName('');
            // Navigate to game with room ID
            navigate(`/game/online?roomId=${room.roomId}`, { state: { role: 'host' } });
        } catch (error) {
            console.error('Failed to create room:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        try {
            await gameApi.joinRoom(roomId);
            navigate(`/game/online?roomId=${roomId}`, { state: { role: 'guest' } });
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. It may be full or no longer available.');
            loadRooms();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRelativeTime = (dateString: string) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

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
                    {/* Left Column: Quick Play */}
                    <div className="lg:col-span-1 space-y-6">
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
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-zinc-700/50 h-full">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    Available Rooms
                                </h2>
                                <button
                                    onClick={loadRooms}
                                    disabled={isLoadingRooms || !isConnected}
                                    className="px-4 py-2 bg-zinc-700/50 rounded-lg hover:bg-zinc-600/50 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {isLoadingRooms ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                                ) : rooms.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="mb-2">No available rooms</p>
                                        <p className="text-sm">Create one to start playing!</p>
                                    </div>
                                ) : (
                                    rooms.map((room) => (
                                        <div
                                            key={room.roomId}
                                            className="bg-gradient-to-r from-zinc-700/40 to-zinc-600/40 backdrop-blur-sm rounded-xl p-4 hover:from-zinc-600/50 hover:to-zinc-500/50 transition-all duration-200 border border-zinc-600/30 group cursor-pointer"
                                            onClick={() => handleJoinRoom(room.roomId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                                                        {room.roomName}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {room.hostUsername}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {getRelativeTime(room.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleJoinRoom(room.roomId);
                                                    }}
                                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium text-sm"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        </div>
                                    ))
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
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="Enter room name..."
                                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                                />
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(39, 39, 42, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(113, 113, 122, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(161, 161, 170, 0.7);
                }
                @keyframes zoom-in {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .animate-in {
                    animation-fill-mode: both;
                }
                .zoom-in {
                    animation-name: zoom-in;
                }
                .fade-in {
                    animation-name: fade-in;
                }
            `}</style>
        </div>
    );
};

export default LobbyPage;
