import { useEffect } from 'react';
import { stockfish } from '../../../engine/stockfish';
import { Chess } from 'chess.js';

interface UseStockfishAiProps {
    game: Chess;
    mode: 'ai' | 'online';
    aiModel?: any;
    userColor: 'w' | 'b';
    currentMoveIndex: number;
    history: { fen: string; san: string }[];
    safeMakeAMove: (move: string | { from: string; to: string; promotion?: string }) => any;
}

export const useStockfishAi = ({
    game,
    mode,
    aiModel,
    userColor,
    currentMoveIndex,
    history,
    safeMakeAMove
}: UseStockfishAiProps) => {
    useEffect(() => {
      if (mode !== 'ai') return;
      
      const isLatestMove = currentMoveIndex === history.length - 1;
      const isAiTurn = game.turn() !== userColor;

      if (isAiTurn && !game.isGameOver() && isLatestMove) {
        let isMounted = true;

        const makeAiMove = async () => {
             if (aiModel) {
                 await stockfish.setElo(aiModel.rating);
                 let contempt = 0;
                 if (aiModel.type === 'aggressive') contempt = 50;
                 else if (aiModel.type === 'defensive') contempt = -50;
                 await stockfish.setContempt(contempt);
             }

             const depth = aiModel?.config?.depth || 10;
             await new Promise(r => setTimeout(r, 500));
             
             if (!isMounted) return;

             try {
                 const bestMoveUci = await stockfish.getBestMove(game.fen(), depth);
                 if (isMounted && bestMoveUci) {
                     const from = bestMoveUci.substring(0, 2);
                     const to = bestMoveUci.substring(2, 4);
                     const promotion = bestMoveUci.length > 4 ? bestMoveUci.substring(4, 5) : undefined;
                     
                     safeMakeAMove({ from, to, promotion });
                 }
             } catch (e) {
                 console.error("Stockfish error:", e);
             }
        };
        
        makeAiMove();
        
        return () => { isMounted = false; };
      }
    }, [game, currentMoveIndex, history, userColor, mode, aiModel, safeMakeAMove]);
};
