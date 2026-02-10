import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { gameApi } from '../../../api/gameApi';

export const useChessGame = (mode: 'ai' | 'online', initialUserColor: 'w' | 'b' = 'w', aiModelId?: number) => {
    const [game, setGame] = useState(new Chess());
    const [history, setHistory] = useState<{ fen: string; san: string }[]>([{ fen: new Chess().fen(), san: '' }]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [userColor, setUserColor] = useState<'w' | 'b'>(initialUserColor);
    const [gameStatus, setGameStatus] = useState<string>('');
    const [isSaved, setIsSaved] = useState(false);
    
    // Refs to support socket/async operations
    const gameRef = useRef(game);
    const historyRef = useRef(history);
    const indexRef = useRef(currentMoveIndex);
    const userColorRef = useRef(userColor);
    const isSavedRef = useRef(isSaved);

    // Sync refs
    useEffect(() => {
        gameRef.current = game;
        historyRef.current = history;
        indexRef.current = currentMoveIndex;
        userColorRef.current = userColor;
        isSavedRef.current = isSaved;
    }, [game, history, currentMoveIndex, userColor, isSaved]);

    const safeMakeAMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
        try {
            const gameCopy = new Chess(gameRef.current.fen());
            const result = gameCopy.move(move);
            
            const newHistory = [...historyRef.current.slice(0, indexRef.current + 1), { fen: gameCopy.fen(), san: result.san }];
            
            setGame(gameCopy);
            setHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            
            return result;
        } catch (e) {
            return null;
        }
    }, []);

    const navigateHistory = useCallback((direction: 'back' | 'forward') => {
        if (direction === 'back') {
            setCurrentMoveIndex(Math.max(0, indexRef.current - 1));
        } else {
            setCurrentMoveIndex(Math.min(historyRef.current.length - 1, indexRef.current + 1));
        }
    }, []);

    const jumpToMove = useCallback((index: number) => {
        setCurrentMoveIndex(index);
    }, []);

    // Check Game Status
    useEffect(() => {
        if (game.isGameOver()) {
            let status = '';
            let winnerColor: 'w' | 'b' | undefined = undefined;
            
            if (game.isCheckmate()) {
                winnerColor = game.turn() === 'w' ? 'b' : 'w';
                const winnerName = winnerColor === 'w' ? 'White' : 'Black';
                const isUserWinner = userColor === winnerColor;
                status = `Checkmate! ${winnerName} wins! ${isUserWinner ? '(You Win!)' : '(You Lose!)'}`;
            } else if (game.isDraw()) {
                status = 'Draw!';
            } else {
                status = 'Game Over';
            }
            // Only set status if not already set or saved (to avoid overwriting server 'Game Over' message if distinct)
            // But here we rely on local detection mainly for AI.
            // For online, server sends 'game_ended' which might update status. 
            // However, local detection is good for immediate feedback.
            
            // In original code, it updates status consistently.
            setGameStatus(status);

            // Save Game Result (AI Mode only)
            if (mode === 'ai' && !isSavedRef.current) {
                const pgn = game.pgn();
                setIsSaved(true);
                // isSavedRef update handled by effect next render, but for immediate logic avoiding dupes:
                isSavedRef.current = true;
                
                gameApi.saveGameResult({
                    mode: 'ai',
                    winnerColor,
                    userColor, 
                    pgn,
                    opponentId: 'ai',
                    aiModelId: aiModelId, 
                }).then(() => {
                    console.log('Game saved successfully');
                }).catch((err) => {
                    console.error('Failed to save game', err);
                });
            }
        } else {
            if (!isSavedRef.current && gameStatus !== '') {
                setGameStatus('');
            }
        }
    }, [game, userColor, mode, aiModelId]);

    const resetGame = useCallback((randomizeColor = true) => {
        const newGame = new Chess();
        setGame(newGame);
        setHistory([{ fen: newGame.fen(), san: '' }]);
        setCurrentMoveIndex(0);
        setGameStatus('');
        setIsSaved(false);
        isSavedRef.current = false;
        if (randomizeColor && mode === 'ai') {
             setUserColor(Math.random() < 0.5 ? 'w' : 'b');
        }
    }, [mode]);

    return {
        game,
        setGame,
        history,
        setHistory,
        currentMoveIndex,
        setCurrentMoveIndex,
        userColor,
        setUserColor,
        gameStatus,
        setGameStatus,
        isSaved,
        setIsSaved,
        gameRef,
        historyRef,
        indexRef,
        userColorRef,
        isSavedRef,
        safeMakeAMove,
        navigateHistory,
        jumpToMove,
        resetGame
    };
};
