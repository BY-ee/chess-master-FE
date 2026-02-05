import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'timeout' | 'error';

interface MatchmakingState {
    status: MatchmakingStatus;
    elapsedTime: number;
    queuePosition?: number;
    estimatedWait?: number;
}

export const useMatchmaking = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    
    const [state, setState] = useState<MatchmakingState>({
        status: 'idle',
        elapsedTime: 0,
    });
    
    const timerRef = useRef<number | null>(null);
    const isSearchingRef = useRef(false);

    // Start matchmaking
    const startMatchmaking = useCallback(() => {
        if (!socket || !socket.connected) {
            toast.error('Not connected to server', { id: 'socket-disconnected' });
            return;
        }

        if (isSearchingRef.current) return;

        console.log('Starting matchmaking...');
        socket.emit('matchmaking_join');
        
        setState({
            status: 'searching',
            elapsedTime: 0,
        });
        
        isSearchingRef.current = true;

        // Start elapsed time counter
        timerRef.current = setInterval(() => {
            setState(prev => ({
                ...prev,
                elapsedTime: prev.elapsedTime + 1,
            }));
        }, 1000);
    }, [socket]);

    // Cancel matchmaking
    const cancelMatchmaking = useCallback(() => {
        if (!socket || !isSearchingRef.current) return;

        console.log('Canceling matchmaking...');
        socket.emit('matchmaking_leave');
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        setState({
            status: 'idle',
            elapsedTime: 0,
        });
        
        isSearchingRef.current = false;
        toast.success('Matchmaking canceled');
    }, [socket]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleMatchFound = (data: { roomId: string }) => {
            console.log('Match found!', data);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            
            setState(prev => ({
                ...prev,
                status: 'found',
            }));
            
            isSearchingRef.current = false;
            toast.success('Match found! Joining game...');
            
            // Navigate to game page
            setTimeout(() => {
                navigate(`/game/online?roomId=${data.roomId}`);
            }, 500);
        };

        const handleMatchTimeout = (data: { message: string }) => {
            console.log('Match timeout:', data);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            
            setState(prev => ({
                ...prev,
                status: 'timeout',
            }));
            
            isSearchingRef.current = false;
            toast.error(data.message || 'Matchmaking timed out');
        };

        const handleMatchSearching = (data: { queuePosition?: number; estimatedWait?: number }) => {
            console.log('Matchmaking update:', data);
            
            setState(prev => ({
                ...prev,
                queuePosition: data.queuePosition,
                estimatedWait: data.estimatedWait,
            }));
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected during matchmaking');
            
            if (isSearchingRef.current) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                
                setState({
                    status: 'error',
                    elapsedTime: 0,
                });
                
                isSearchingRef.current = false;
                toast.error('Disconnected from server');
            }
        };

        socket.on('matchmaking_found', handleMatchFound);
        socket.on('matchmaking_timeout', handleMatchTimeout);
        socket.on('matchmaking_searching', handleMatchSearching);
        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('matchmaking_found', handleMatchFound);
            socket.off('matchmaking_timeout', handleMatchTimeout);
            socket.off('matchmaking_searching', handleMatchSearching);
            socket.off('disconnect', handleDisconnect);
            
            // Cleanup timer on unmount
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [socket, navigate]);

    // Cleanup on unmount - cancel matchmaking if still searching
    useEffect(() => {
        return () => {
            if (isSearchingRef.current && socket) {
                socket.emit('matchmaking_leave');
            }
        };
    }, [socket]);

    return {
        status: state.status,
        elapsedTime: state.elapsedTime,
        queuePosition: state.queuePosition,
        estimatedWait: state.estimatedWait,
        isSearching: state.status === 'searching',
        startMatchmaking,
        cancelMatchmaking,
    };
};
