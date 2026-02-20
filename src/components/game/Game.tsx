import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { type AiModel } from './AiBotSelector';

import { useChessGame } from './hooks/useChessGame';
import { useGameSocket } from './hooks/useGameSocket';
import { useStockfishAi } from './hooks/useStockfishAi';

import { GameBoard } from './GameBoard';
import { GameInfo } from './GameInfo';
import { MoveHistory } from './MoveHistory';
import { GameControls } from './GameControls';
import { GameResultModal } from './GameResultModal';
import { RematchIncomingModal } from './RematchIncomingModal';

interface GameProps {
    mode: 'ai' | 'online';
    roomId?: string;
    aiModel?: AiModel;
}

const Game = ({ mode, roomId, aiModel }: GameProps) => {
    const { user } = useAuthStore();
    const socket = useSocket();
    const navigate = useNavigate();

    // 1. Core Chess Logic & State
    const chessGame = useChessGame(mode, 'w', aiModel?.id);
    const { 
        game, history, currentMoveIndex, userColor, gameStatus, isSaved, 
        safeMakeAMove, navigateHistory, jumpToMove, resetGame, setGameStatus
    } = chessGame;

    // 2. Socket Logic & Online State
    const gameSocket = useGameSocket(socket, mode, roomId, user, chessGame);
    const { 
        opponent, isWaitingForOpponent, isRoomVerified, 
        rematchRequested, rematchIncoming, timeLeft, 
        isRematchDisabled, isRematchExpired, rematchCooldown,
        emitMove, requestRematch, cancelRematch, 
        acceptRematch, declineRematch,
        resignGame, offerDraw,
        ratingChanges,
        emitGameEnd
    } = gameSocket;

    // 3. AI Logic
    useStockfishAi({
        game,
        mode,
        aiModel,
        userColor,
        currentMoveIndex,
        history,
        safeMakeAMove
    });

    // Handle Online Game End Emission
    useEffect(() => {
        if (mode === 'online' && game.isGameOver() && !isSaved) {
            let winnerColor: 'w' | 'b' | undefined = undefined;
            if (game.isCheckmate()) {
                winnerColor = game.turn() === 'w' ? 'b' : 'w';
            }
            
            // Fix duplicate game end events: Only the player who delivered the last move emits
            // When game is over (checkmate/stalemate), the turn is passed to the player who cannot move.
            // So if game.turn() !== userColor, it means I made the last move.
            if (game.turn() !== userColor) {
                emitGameEnd(winnerColor, game.pgn());
            }
        }
    }, [mode, game, isSaved, userColor, emitGameEnd]);

    // 4. Input Handlers
    const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
        // Prevent moves if reviewing past history
        if (currentMoveIndex !== history.length - 1) return false;
        
        // Prevent moves if it's not user's turn, game is over, or game was ended by server
        if (game.turn() !== userColor || game.isGameOver() || isSaved) return false;

        const piece = game.get(sourceSquare as any);
        const isPromotion = 
            piece?.type === 'p' && 
            ((userColor === 'w' && sourceSquare[1] === '7' && targetSquare[1] === '8') ||
             (userColor === 'b' && sourceSquare[1] === '2' && targetSquare[1] === '1'));

        const moveData: { from: string; to: string; promotion?: string } = {
            from: sourceSquare,
            to: targetSquare,
        };

        if (isPromotion) {
            moveData.promotion = 'q';
        }

        const move = safeMakeAMove(moveData);

        if (move) {
            emitMove(move.san);
        }

        return move !== null;
    }, [game, userColor, currentMoveIndex, history, isSaved, safeMakeAMove, emitMove]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                navigateHistory('back');
            } else if (e.key === 'ArrowRight') {
                navigateHistory('forward');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigateHistory]);

    // Helper for display
    const displayFen = history[currentMoveIndex]?.fen || game.fen();

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full max-w-6xl mx-auto p-4">
            {/* Left: Game Board Area */}
            <div className="flex flex-col items-center gap-6 w-full max-w-[600px]">
                <GameInfo 
                    game={game}
                    userColor={userColor}
                    mode={mode}
                    gameStatus={gameStatus}
                    aiModel={aiModel}
                    opponent={opponent}
                    onReset={() => resetGame(true)}
                />

                <GameBoard 
                    game={game}
                    userColor={userColor}
                    mode={mode}
                    isWaitingForOpponent={isWaitingForOpponent}
                    isRoomVerified={isRoomVerified}
                    opponent={opponent}
                    currentMoveIndex={currentMoveIndex}
                    historyLength={history.length}
                    isSaved={isSaved}
                    gameStatus={gameStatus}
                    displayFen={displayFen}
                    onDrop={onDrop}
                />

                {/* Navigation Controls */}
                <div className="flex items-center gap-4 glass-panel p-2 rounded-xl bg-zinc-800/50">
                    <button 
                        onClick={() => navigateHistory('back')} 
                        disabled={currentMoveIndex === 0}
                        className="p-3 hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors"
                        aria-label="Previous Move"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-mono text-zinc-400 min-w-[100px] text-center">
                        {currentMoveIndex} / {history.length - 1}
                    </span>
                    <button 
                        onClick={() => navigateHistory('forward')} 
                        disabled={currentMoveIndex === history.length - 1}
                        className="p-3 hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors"
                         aria-label="Next Move"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Right: Sidebar */}
            <div className="w-full lg:w-[300px]">
                 <MoveHistory 
                    history={history}
                    currentMoveIndex={currentMoveIndex}
                    jumpToMove={jumpToMove}
                    userColor={userColor}
                    mode={mode}
                    displayFen={displayFen}
                 />
                 
                 <GameControls 
                    mode={mode}
                    gameStatus={gameStatus}
                    isSaved={isSaved}
                    onResign={resignGame}
                    onOfferDraw={offerDraw}
                 />
            </div>
            
            {/* Modals */}
            <GameResultModal 
                gameStatus={gameStatus}
                isCheckmate={game.isCheckmate()}
                mode={mode}
                rematchRequested={rematchRequested}
                isRematchDisabled={isRematchDisabled}
                isRematchExpired={isRematchExpired}
                rematchCooldown={rematchCooldown}
                onRematch={requestRematch}
                onCancelRematch={cancelRematch}
                onNewGame={() => resetGame(true)}
                onFindNewOpponent={() => navigate('/matchmaking')}
                onClose={() => setGameStatus('')}
                rotation={userColor}
                ratingChanges={ratingChanges}
            />

            <RematchIncomingModal 
                rematchIncoming={rematchIncoming}
                timeLeft={timeLeft}
                onAccept={acceptRematch}
                onDecline={declineRematch}
            />
        </div>
    );
};

export default Game;
