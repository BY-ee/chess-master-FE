import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

export interface GameResultDto {
    mode: 'ai' | 'online';
    result: 'win' | 'loss' | 'draw';
    winnerColor?: 'w' | 'b'; // Optional, inferred from result + user color if needed
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
    saveGameResult: async (data: GameResultDto) => {
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

    // Future: Get Hand history
    getMyGames: async () => {
         try {
            const response = await axios.get(`${API_URL}/games/my`, {
                headers: getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
             console.error('Failed to fetch moves:', error);
             throw error;
        }
    }
};
