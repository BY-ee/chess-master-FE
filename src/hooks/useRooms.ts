import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuthStore } from '../store/useAuthStore';
import { gameApi } from '../api/gameApi';

export interface Room {
    roomId: string;
    roomName: string;
    hostUsername: string;
    createdAt: string;
}

interface UseRoomsOptions {
    enableOnlineCount?: boolean;
}

export const useRooms = (options: UseRoomsOptions = {}) => {
    const { enableOnlineCount = false } = options;
    const socket = useSocket();
    const user = useAuthStore((state) => state.user);
    
    const [isConnected, setIsConnected] = useState(false);
    const [onlinePlayers, setOnlinePlayers] = useState(0);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeGames, setActiveGames] = useState<Room[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Socket event handlers
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

        const handleOnlineCount = (count: number) => {
            if (enableOnlineCount) {
                setOnlinePlayers(count);
            }
        };

        const handleRoomCreated = (newRoom: Room) => {
            setRooms(prev => [newRoom, ...prev]);
            // If I created this room (e.g. from another tab), add to my active games
            if (user && newRoom.hostUsername === user.username) {
                setActiveGames(prev => [newRoom, ...prev]);
            }
        };

        const handleRoomDeleted = (data: { roomId: string }) => {
            setRooms(prev => prev.filter(r => r.roomId !== data.roomId));
            setActiveGames(prev => prev.filter(r => r.roomId !== data.roomId));
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('online_count', handleOnlineCount);
        socket.on('room_created', handleRoomCreated);
        socket.on('room_deleted', handleRoomDeleted);

        if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('online_count', handleOnlineCount);
            socket.off('room_created', handleRoomCreated);
            socket.off('room_deleted', handleRoomDeleted);
        };
    }, [socket, user, enableOnlineCount]);

    // Load rooms
    const loadRooms = useCallback(async (isLoadMore = false) => {
        if (!isConnected) return;
        
        // Prevent dup calls using a ref check would be better, but we'll use state
        setIsLoadingRooms(prev => {
            if (isLoadMore && (!nextCursor || prev)) return prev;
            return true;
        });

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
    }, [isConnected, nextCursor, searchTerm]);

    // Load active games
    const loadActiveGames = useCallback(async () => {
        if (!isConnected) return;
        try {
            const games = await gameApi.getActiveGames();
            setActiveGames(games);
        } catch (error) {
            console.error('Failed to load active games:', error);
        }
    }, [isConnected]);

    // Load data when connected - only once when connection established
    useEffect(() => {
        if (isConnected) {
            loadRooms();
            loadActiveGames();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isConnected) loadRooms(false);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, isConnected]);

    // Helper function: Get relative time
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

    return {
        // State
        isConnected,
        onlinePlayers,
        rooms,
        activeGames,
        isLoadingRooms,
        searchTerm,
        hasMore,
        
        // Actions
        setSearchTerm,
        loadRooms,
        loadActiveGames,
        
        // Helpers
        getRelativeTime,
    };
};
