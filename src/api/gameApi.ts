import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

export interface SaveGameRequest {
    mode: 'ai' | 'online';
    result?: 'win' | 'loss' | 'draw'; // DEPRECATED: Backend ignores this field and derives from winnerColor
    winnerColor?: 'w' | 'b'; // Required for non-draw games
    userColor: 'w' | 'b'; // REQUIRED: To identify if user played white or black
    pgn: string;
    opponentId?: string; // 'ai' or user UUID
    metadata?: Record<string, any>; // Difficulty, etc.
}

// Create an axios instance with auth interceptor if needed, 
// or just use a helper function. 
// Assuming useAuthStore has the token, we can attach it.

const getAuthHeaders = () => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const gameApi = {
    saveGameResult: async (data: SaveGameRequest) => {
        try {
            const response = await axios.post(`${API_URL}/games`, data, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            console.error('Failed to save game result:', error);
            throw error;
        }
    },

    // Get Hand history
    getMyGames: async () => {
         try {
            const response = await axios.get(`${API_URL}/games`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
             console.error('Failed to fetch moves:', error);
             throw error;
        }
    },

    // Room Management for Multiplayer
    createRoom: async () => {
        try {
            const response = await axios.post(`${API_URL}/games/rooms`, {}, {
                headers: getAuthHeaders(),
            });
            return response.data; // Expected: { roomId: string, ... }
        } catch (error) {
            console.error('Failed to create room:', error);
            throw error;
        }
    },

    joinRoom: async (roomId: string) => {
        try {
            const response = await axios.post(`${API_URL}/games/rooms/${roomId}/join`, {}, {
                headers: getAuthHeaders(),
            });
            return response.data; // Expected: { success: boolean, ... }
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    },

    getRooms: async () => {
        try {
            const response = await axios.get(`${API_URL}/games/rooms`, {
                headers: getAuthHeaders(),
            });
            return response.data; // Expected: Room[]
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            throw error;
        }
    }
};
