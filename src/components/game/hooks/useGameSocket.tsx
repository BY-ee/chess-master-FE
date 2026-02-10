import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Socket } from 'socket.io-client';
import { Chess } from 'chess.js';
import { SOCKET_EVENTS } from '../constants';
import type { RatingChanges } from '../types';

interface GameControl {
    gameRef: React.MutableRefObject<Chess>;
    historyRef: React.MutableRefObject<{ fen: string; san: string }[]>;
    indexRef: React.MutableRefObject<number>;
    userColorRef: React.MutableRefObject<'w' | 'b'>;
    isSavedRef: React.MutableRefObject<boolean>;
    safeMakeAMove: (move: string | { from: string; to: string; promotion?: string }) => any;
    resetGame: (randomizeColor?: boolean) => void;
    setGame: (game: Chess) => void;
    setHistory: (history: { fen: string; san: string }[]) => void;
    setCurrentMoveIndex: (index: number) => void;
    setGameStatus: (status: string) => void;
    setIsSaved: (isSaved: boolean) => void;
    setUserColor: (color: 'w' | 'b') => void;
}

interface User {
    id: string;
    username: string;
}

export const useGameSocket = (
    socket: Socket | null,
    mode: 'ai' | 'online',
    roomId: string | undefined,
    user: User | null,
    {
        gameRef,
        userColorRef,
        isSavedRef,
        safeMakeAMove,
        resetGame,
        setGame,
        setHistory,
        setCurrentMoveIndex,
        setGameStatus,
        setIsSaved,
        setUserColor
    }: GameControl
) => {
    const navigate = useNavigate();

    // Socket-driven State
    const [opponent, setOpponent] = useState<{ username: string; rating?: number } | null>(null);
    const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(mode === 'online');
    const [isRoomVerified, setIsRoomVerified] = useState(mode !== 'online');
    
    // Rematch State
    const [rematchRequested, setRematchRequested] = useState(false);
    const [rematchIncoming, setRematchIncoming] = useState<{ requestedBy: number; expiresAt: Date } | null>(null);
    const rematchIncomingRef = useRef<{ requestedBy: number; expiresAt: Date } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [isRematchDisabled, setIsRematchDisabled] = useState(false);
    const [isRematchExpired, setIsRematchExpired] = useState(false);
    const [rematchCooldown, setRematchCooldown] = useState(0);
    const [ratingChanges, setRatingChanges] = useState<RatingChanges | null>(null);

    const roomIdRef = useRef(roomId);
    
    useEffect(() => {
        roomIdRef.current = roomId;
    }, [roomId]);

    useEffect(() => {
        if (mode !== 'online' || !socket || !roomId) return;

        console.log(`Joining game room: ${roomId}`);
        socket.emit(SOCKET_EVENTS.JOIN_GAME, { roomId });

        const handlePlayerJoined = (data: any) => {
            console.log('Player joined:', data);
            setIsRoomVerified(true);
            toast(`Player ${data.username} joined! (${data.currentPlayers}/2)`);
            
            if (user && data.username !== user.username) {
                setOpponent({ username: data.username, rating: data.rating });
            } else if (user && data.username === user.username) {
                if (data.existingPlayers) {
                    const opp = data.existingPlayers.find((p: any) => p.username !== user.username);
                    if (opp) setOpponent({ username: opp.username, rating: opp.rating });
                }
            }
        };

        const handlePlayerLeft = (data: any) => {
            console.log('Player left:', data);
            toast.error(`Player ${data.username} left the game.`);
            if (data.currentPlayers < 2) {
                setIsWaitingForOpponent(true);
                setOpponent(null);
            }
        };

        const handleGameReady = (data: any) => {
            console.log('Game Ready!', data);
            setIsRoomVerified(true);
            setIsWaitingForOpponent(false);
            toast.success('Game Started! Good luck.');
            
            if (data.players && user) {
                const isWhite = String(data.whiteId) === String(user.id);
                const opp = isWhite ? data.players.black : data.players.white;
                if (opp) setOpponent(prev => prev || opp);
            }
        };

        const handleMoveMade = (move: string) => {
            console.log('Received move_made:', move);
            safeMakeAMove(move);
        };

        const handleGameEnded = (data: { result: '1-0' | '0-1' | '1/2-1/2'; saved: boolean; ratingChanges?: RatingChanges }) => {
            console.log('Game ended event received:', data);
            if (isSavedRef.current) return;

            let winner: 'w' | 'b' | 'draw' = 'draw';
            if (data.result === '1-0') winner = 'w';
            else if (data.result === '0-1') winner = 'b';
            
            if (winner === 'draw') {
                 setGameStatus('Game Over - Draw');
            } else {
                 const isUserWinner = winner === userColorRef.current;
                 setGameStatus(isUserWinner ? 'You Win! (Online)' : 'You Lose! (Online)');
            }
            
            if (data.ratingChanges) {
                setRatingChanges(data.ratingChanges);
            }

            setIsSaved(true);
            isSavedRef.current = true;
        };

        const handleRematchRequested = (data: { requestedBy: number; expiresAt: Date }) => {
            console.log('Rematch requested:', data);
            if (user && String(data.requestedBy) !== String(user.id)) {
                 const now = new Date().getTime();
                 const expires = new Date(data.expiresAt).getTime();
                 const initialSeconds = Math.max(0, Math.floor((expires - now) / 1000));
                 setTimeLeft(initialSeconds);
                 setRematchIncoming(data);
                 rematchIncomingRef.current = data;
            }
        };

        const handleGameRestarted = (data: any) => {
            console.log('Game restarted!', data);
            
            // Reset local game state via hook logic
            // We need to call resetGame but passing false to prevent random color assignment for AI logic (though mode is online here)
            // Actually resetGame logic from useChessGame takes randomizeColor bool.
            const newGame = new Chess();
            setGame(newGame);
            setHistory([{ fen: newGame.fen(), san: '' }]);
            setCurrentMoveIndex(0);
            setGameStatus('');
            setIsSaved(false);
            isSavedRef.current = false;
            
            // Rematch state reset
            setRematchRequested(false);
            setRematchIncoming(null);
            rematchIncomingRef.current = null;
            setIsRematchDisabled(false);
            setIsRematchExpired(false);
            setRematchCooldown(0);
            setIsWaitingForOpponent(false);

            if (user && data.players) {
                const isWhite = String(data.whiteId) === String(user.id);
                const newColor = isWhite ? 'w' : 'b';
                setUserColor(newColor);
                userColorRef.current = newColor; // Manual sync just in case, though useEffect in useChessGame handles it on next render
                
                const opp = isWhite ? data.players.black : data.players.white;
                if (opp) setOpponent(opp);
            }
        };

        const handleRematchDeclined = (data: { declinedBy: number }) => {
            console.log('Rematch declined:', data);
            if (user && String(data.declinedBy) !== String(user.id)) {
                const isCancellation = rematchIncomingRef.current && String(rematchIncomingRef.current.requestedBy) === String(data.declinedBy);
                
                if (isCancellation) {
                     toast.success('Rematch request canceled by opponent.');
                } else {
                     toast.error('Rematch declined.');
                     setIsRematchDisabled(true);
                }
            }
            setRematchRequested(false);
            setRematchIncoming(null);
            rematchIncomingRef.current = null;
        };

        const handleDrawOffered = () => {
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-semibold">Opponent offered a draw</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                socket?.emit(SOCKET_EVENTS.ACCEPT_DRAW, { roomId: roomIdRef.current });
                                toast.dismiss(t.id);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500"
                        >
                            Accept
                        </button>
                        <button 
                            onClick={() => {
                                socket?.emit(SOCKET_EVENTS.DECLINE_DRAW, { roomId: roomIdRef.current });
                                toast.dismiss(t.id);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ), { duration: 10000, position: 'top-center' });
        };

        const handleDrawDeclined = () => {
            toast.error('Draw offer declined');
        };

        const handleGameStart = (data: any) => {
            console.log('Game start!', data);
            setIsRoomVerified(true);
            setUserColor(data.color);
            userColorRef.current = data.color;
            
            if (data.opponent) {
                setOpponent(data.opponent);
            } else if (data.players) {
                const isWhite = data.color === 'w';
                const opp = isWhite ? data.players.black : data.players.white;
                if (opp) setOpponent(opp);
            } else {
                setOpponent(prev => prev || { username: 'Opponent' });
            }
            
            setIsWaitingForOpponent(false);
            
            if (data.fen || data.pgn) {
                console.log('Restoring game state from server...');
                const newGame = new Chess();
                try {
                    let reconstructedHistory: { fen: string; san: string }[] = [{ fen: new Chess().fen(), san: '' }];

                    if (data.pgn) {
                        newGame.loadPgn(data.pgn);
                        const tempGame = new Chess();
                        const moves = newGame.history({ verbose: true });
                        moves.forEach((move: any) => {
                            tempGame.move(move);
                            reconstructedHistory.push({ fen: tempGame.fen(), san: move.san });
                        });
                    } else if (data.fen) {
                        newGame.load(data.fen);
                        reconstructedHistory.push({ fen: newGame.fen(), san: '' });
                    }
                    
                    setGame(newGame);
                    setHistory(reconstructedHistory);
                    setCurrentMoveIndex(reconstructedHistory.length - 1);
                } catch (e) {
                    console.error('Failed to load remote state:', e);
                    resetGame(false);
                }
            } else {
                resetGame(false);
            }
        };

        const handleError = (error: any) => {
             console.error('Socket error:', error);
             const code = error?.code || 'GENERIC_ERROR';
             const message = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));

             switch (code) {
                case 'ROOM_EXPIRED':
                case 'ROOM_NOT_FOUND':
                    toast.error(`Room unavailable: ${message}`);
                    setTimeout(() => navigate('/lobby'), 1500);
                    break;
                case 'REMATCH_EXPIRED':
                case 'NO_REMATCH_REQUEST':
                case 'INVALID_ACTION':
                    toast.error(`Action failed: ${message}`);
                    setRematchRequested(false);
                    setRematchIncoming(null);
                    if (code === 'REMATCH_EXPIRED') setIsRematchExpired(true);
                    break;
                default:
                     console.warn('Game Error:', message);
                    break;
             }
        };

        socket.on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
        socket.on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
        socket.on(SOCKET_EVENTS.GAME_READY, handleGameReady);
        socket.on(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
        socket.on(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
        socket.on(SOCKET_EVENTS.REMATCH_REQUESTED, handleRematchRequested);
        socket.on(SOCKET_EVENTS.GAME_RESTARTED, handleGameRestarted);
        socket.on(SOCKET_EVENTS.REMATCH_DECLINED, handleRematchDeclined);
        socket.on(SOCKET_EVENTS.DRAW_OFFERED, handleDrawOffered);
        socket.on(SOCKET_EVENTS.DRAW_DECLINED, handleDrawDeclined);
        socket.on(SOCKET_EVENTS.GAME_START, handleGameStart);
        socket.on(SOCKET_EVENTS.ERROR, handleError);

        return () => {
            socket.off(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
            socket.off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
            socket.off(SOCKET_EVENTS.GAME_READY, handleGameReady);
            socket.off(SOCKET_EVENTS.MOVE_MADE, handleMoveMade);
            socket.off(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
            socket.off(SOCKET_EVENTS.REMATCH_REQUESTED, handleRematchRequested);
            socket.off(SOCKET_EVENTS.GAME_RESTARTED, handleGameRestarted);
            socket.off(SOCKET_EVENTS.REMATCH_DECLINED, handleRematchDeclined);
            socket.off(SOCKET_EVENTS.DRAW_OFFERED, handleDrawOffered);
            socket.off(SOCKET_EVENTS.DRAW_DECLINED, handleDrawDeclined);
            socket.off(SOCKET_EVENTS.GAME_START, handleGameStart);
            socket.off(SOCKET_EVENTS.ERROR, handleError);
            
            console.log(`Leaving game room: ${roomId}`);
            socket.emit(SOCKET_EVENTS.LEAVE_GAME, { roomId });
        };
    }, [mode, socket, roomId]);

    // Rematch Timer
    useEffect(() => {
        if (!rematchIncoming) return;
        const interval = setInterval(() => {
             const now = new Date().getTime();
             const expires = new Date(rematchIncoming.expiresAt).getTime();
             const seconds = Math.max(0, Math.floor((expires - now) / 1000));
             setTimeLeft(seconds);
             if (seconds <= 0) {
                 setRematchIncoming(null);
                 rematchIncomingRef.current = null;
             }
        }, 1000);
        return () => clearInterval(interval);
    }, [rematchIncoming]);

    // Rematch Cooldown Timer
    useEffect(() => {
        if (rematchCooldown > 0) {
            const timer = setTimeout(() => setRematchCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [rematchCooldown]);

    // Emitters
    const emitMove = (moveSan: string) => {
        if (mode === 'online' && socket && roomId) {
            console.log('Sending move:', moveSan);
            socket.emit(SOCKET_EVENTS.MAKE_MOVE, { roomId, move: moveSan });
        }
    };

    const emitGameEnd = (winnerColor: 'w' | 'b' | undefined, pgn: string) => {
        if (mode === 'online' && socket && roomId && !isSavedRef.current) {
            setIsSaved(true);
            isSavedRef.current = true;
            socket.emit(SOCKET_EVENTS.GAME_END, { roomId, winnerColor, pgn });
        }
    };

    const requestRematch = () => {
        if (mode === 'online' && socket && roomId) {
            socket.emit(SOCKET_EVENTS.REQUEST_REMATCH, { roomId });
            setRematchRequested(true);
        }
    };

    const acceptRematch = () => {
        if (mode === 'online' && socket && roomId) {
            socket.emit(SOCKET_EVENTS.ACCEPT_REMATCH, { roomId });
            setRematchIncoming(null);
            rematchIncomingRef.current = null;
        }
    };

    const declineRematch = () => {
        if (mode === 'online' && socket && roomId) {
             socket.emit(SOCKET_EVENTS.DECLINE_REMATCH, { roomId });
             setRematchIncoming(null);
             rematchIncomingRef.current = null;
             setRematchRequested(false);
        }
    };

    const cancelRematch = () => {
        if (mode === 'online' && socket && roomId) {
             socket.emit(SOCKET_EVENTS.DECLINE_REMATCH, { roomId });
             setRematchRequested(false);
             setRematchCooldown(5);
        }
    };

    const resignGame = () => {
        if (mode === 'online' && socket && roomId && !gameRef.current.isGameOver() && !isSavedRef.current) {
            if (confirm("Are you sure you want to resign?")) {
                socket.emit(SOCKET_EVENTS.RESIGN_GAME, { roomId });
            }
        }
    };

    const offerDraw = () => {
         if (mode === 'online' && socket && roomId && !gameRef.current.isGameOver() && !isSavedRef.current) {
             socket.emit(SOCKET_EVENTS.OFFER_DRAW, { roomId });
             toast.success('Draw offer sent');
         }
    };

    return {
        opponent,
        isWaitingForOpponent,
        isRoomVerified,
        rematchRequested,
        rematchIncoming,
        timeLeft,
        isRematchDisabled,
        isRematchExpired,
        rematchCooldown,
        emitMove,
        emitGameEnd,
        requestRematch,
        acceptRematch,
        declineRematch,
        cancelRematch,
        resignGame,
        offerDraw,
        setRematchRequested,
        setRematchIncoming,
        ratingChanges
    };
};
