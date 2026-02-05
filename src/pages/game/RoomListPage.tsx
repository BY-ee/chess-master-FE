import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocket } from '../../hooks/useSocket';
import React, { useEffect, useState, useCallback } from 'react';
import { gameApi } from '../../api/gameApi';
import { Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Room {
    roomId: string;
    roomName: string;
    hostUsername: string;
    createdAt: string;
}

// Optimized Room Item Component
const RoomItem = React.memo(({ room, onJoin, getRelativeTime }: { room: Room; onJoin: (id: string) => void; getRelativeTime: (d: string) => string }) => (
    <div
        className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 transition-colors border border-zinc-700 hover:border-zinc-600 group cursor-pointer"
        onClick={() => onJoin(room.roomId)}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 text-zinc-100 group-hover:text-blue-400 transition-colors">
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
                    onJoin(room.roomId);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium text-sm text-white"
            >
                Join
            </button>
        </div>
    </div>
));

const RoomListPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const socket = useSocket();
    
    const [isConnected, setIsConnected] = useState(false);

    const [rooms, setRooms] = useState<Room[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [createRoomError, setCreateRoomError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    
    // Filtering & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Backend-driven active games list
    const [activeGames, setActiveGames] = useState<Room[]>([]);


    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setIsConnected(true);
            console.log('Socket connected to lobby');
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            console.log('Socket disconnected from lobby');
        };

        const handleOnlineCount = (_count: number) => {
            // setOnlinePlayers(count); // Removed from this view
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('online_count', handleOnlineCount);

        // Real-time Room Updates
        socket.on('room_created', (newRoom: Room) => {
            setRooms(prev => [newRoom, ...prev]);
            // If I created this room (e.g. from another tab), add to my active games
            if (user && newRoom.hostUsername === user.username) {
                setActiveGames(prev => [newRoom, ...prev]);
            }
        });

        socket.on('room_deleted', (data: { roomId: string }) => {
            setRooms(prev => prev.filter(r => r.roomId !== data.roomId));
            setActiveGames(prev => prev.filter(r => r.roomId !== data.roomId));
        });

        if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('online_count', handleOnlineCount);
            socket.off('room_created');
            socket.off('room_deleted');
        };
    }, [socket, user]);

    // Load data when connected
    useEffect(() => {
        if (isConnected) {
            loadRooms();
            loadActiveGames();
        }
    }, [isConnected]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isConnected) loadRooms(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, isConnected]);

    const loadRooms = async (isLoadMore = false) => {
        if (!isConnected) return;
        
        // Prevent dup calls
        if (isLoadMore && (!nextCursor || isLoadingRooms)) return;

        setIsLoadingRooms(true);
        try {
            const currentCursor = isLoadMore ? nextCursor : undefined;
            const response = await gameApi.getRooms({ 
                cursor: currentCursor as string, 
                limit: 10,
                search: searchTerm 
            });
            
            // Handle response structure { data: [], nextCursor: ... } or legacy []
            const newRooms = Array.isArray(response) ? response : (response.data || []);
            const newNextCursor = !Array.isArray(response) ? response.nextCursor : null;

            if (isLoadMore) {
                // Filter out duplicates that might have been added via socket events or overlapping cursors
                setRooms(prev => {
                    const existingIds = new Set(prev.map(r => r.roomId));
                    const uniqueNewRooms = newRooms.filter((r: Room) => !existingIds.has(r.roomId));
                    return [...prev, ...uniqueNewRooms];
                });
            } else {
                setRooms(newRooms);
            }
            
            setNextCursor(newNextCursor);
            setHasMore(!!newNextCursor);

        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setIsLoadingRooms(false);
        }
    };

    const loadActiveGames = async () => {
        if (!isConnected) return;
        try {
            const games = await gameApi.getActiveGames();
            setActiveGames(games);
        } catch (error) {
            console.error('Failed to load active games:', error);
        }
    };

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

    // Memoize helper to prevent re-creation
    const getRelativeTime = useCallback((dateString: string) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    }, []);

    const handleLoadMore = () => {
        loadRooms(true);
    };

    // Derived state: Filter active games from available rooms to prevent duplicates
    const displayedRooms = rooms.filter(room => !activeGames.find(ag => ag.roomId === room.roomId));

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            All Rooms
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
                


                <div className="grid grid-cols-1 gap-6">
                    {/* Full Width Available Rooms */}
                    <div className="col-span-1">
                        <div className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-zinc-700/50 h-full flex flex-col min-h-[600px]">
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="whitespace-nowrap">All Available Rooms</span>
                                </h2>

                                <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 max-w-md">
                                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search rooms by name or host..."
                                            className="w-full pl-10 pr-4 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-zinc-100 placeholder-zinc-500"
                                            autoFocus
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

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {!isConnected ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>Connect to server to view rooms</p>
                                    </div>
                                ) : isLoadingRooms && rooms.length === 0 ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
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
                                            {searchTerm ? 'No rooms match your search' : 'No available rooms found'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {displayedRooms.map((room) => (
                                                <RoomItem 
                                                    key={room.roomId} 
                                                    room={room} 
                                                    onJoin={handleJoinRoom} 
                                                    getRelativeTime={getRelativeTime} 
                                                />
                                            ))}
                                        </div>

                                        {hasMore && (
                                            <button 
                                                onClick={handleLoadMore}
                                                disabled={isLoadingRooms}
                                                className="w-full py-3 mt-6 bg-zinc-700/30 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all text-sm font-medium border border-dashed border-zinc-600/50 disabled:opacity-50"
                                            >
                                                {isLoadingRooms ? 'Loading more...' : 'Load More Rooms'}
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

export default RoomListPage;
