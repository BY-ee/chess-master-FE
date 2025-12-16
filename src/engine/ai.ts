import { Chess } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0, // King value is irrelevant for material count usually, or infinite
};

export const getBestMove = (game: Chess): string | null => {
    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return null;

    // 1. Try to find a move that captures a piece
    let bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    let bestValue = -Infinity;

    for (const move of possibleMoves) {
        game.move(move);
        const value = evaluateBoard(game);
        game.undo();

        // Add some randomness to avoid repetitive play in equal positions
        const randomFactor = Math.random() * 0.5;

        if (value + randomFactor > bestValue) {
            bestValue = value + randomFactor;
            bestMove = move;
        }
    }

    return bestMove;
};

const evaluateBoard = (game: Chess): number => {
    const board = game.board();
    let totalEvaluation = 0;

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                totalEvaluation += piece.color === 'w' ? value : -value;
            }
        }
    }

    // If it's black's turn (AI), we want to minimize the score (since white is positive)
    // But the getBestMove function maximizes the result of this function after making a move.
    // Wait, if AI is Black, it wants the board evaluation to be as negative as possible.
    // So if we are maximizing 'value' in getBestMove, we need to return the evaluation from the perspective of the side moving.

    // Let's simplify:
    // We just return the raw score (White - Black).
    // If it's White's turn, they want to Maximize this.
    // If it's Black's turn, they want to Minimize this.

    return totalEvaluation * (game.turn() === 'w' ? 1 : -1);
};
