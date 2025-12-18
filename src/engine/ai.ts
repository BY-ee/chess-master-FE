import { Chess } from 'chess.js';

// --- Evaluation Constants ---
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (PST)
// Higher values encourage pieces to move to those squares.
// Oriented for White. For Black, we mirror the rank.

const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

const TABLE_MAP: Record<string, number[][]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_PST,
};

// --- Helper Functions ---

const evaluateBoard = (game: Chess): number => {
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      // If White Turn -> White is Mated -> Black Wins -> Score is Minimum (-100000)
      // If Black Turn -> Black is Mated -> White Wins -> Score is Maximum (+100000)
      return game.turn() === 'w' ? -100000 : 100000;
    }
    if (game.isDraw()) {
      return 0;
    }
  }

  let score = 0;
  const board = game.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        
        // Positional Score
        let pstScore = 0;
        const table = TABLE_MAP[piece.type];
        if (table) {
            // If White, use rank/file as is. If Black, mirror rank.
            const pstRank = piece.color === 'w' ? rank : 7 - rank;
            const pstFile = file; // No need to mirror file usually, unless symmetric
            pstScore = table[pstRank][pstFile];
        }

        if (piece.color === 'w') {
          score += value + pstScore;
        } else {
          score -= (value + pstScore);
        }
      }
    }
  }
  return score;
};

// --- Minimax with Alpha-Beta Pruning ---

const MAX_DEPTH = 3; // Depth 3 is reasonable for JS engine performance
let nodesExplored = 0;

const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number => {
  nodesExplored++;
  
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();
  
  // Optimization: Sort moves to check captures first (Move Ordering)
  // This helps Alpha-Beta prune more branches early.
  // Note: Simple sorting by capture string presence
  moves.sort((a, b) => {
      const aCapture = a.includes('x') ? 1 : 0;
      const bCapture = b.includes('x') ? 1 : 0;
      return bCapture - aCapture;
  });

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalValue = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) {
        break; // Beta Pruning
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalValue = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) {
        break; // Alpha Pruning
      }
    }
    return minEval;
  }
};

export const getBestMove = (game: Chess): string | null => {
  nodesExplored = 0;
  const startTime = performance.now();
  
  const potentialMoves = game.moves();
  if (potentialMoves.length === 0) return null;

  let bestMove = null;
  // White maximizes score, Black minimizes score.
  // Since our evaluateBoard returns (White - Black), 
  // White wants Max, Black wants Min.
  const isWhiteTurn = game.turn() === 'w';
  
  // Important: If AI plays Black, it should pick the move that results in the LOWEST score.
  // If AI plays White, it should pick HIGHEST score.
  
  let bestValue = isWhiteTurn ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  // Move ordering at root
  potentialMoves.sort((a, b) => {
      const aCapture = a.includes('x') ? 1 : 0;
      const bCapture = b.includes('x') ? 1 : 0;
      return bCapture - aCapture;
  });

  for (const move of potentialMoves) {
    game.move(move);
    // Recursively call minimax
    const boardValue = minimax(game, MAX_DEPTH - 1, alpha, beta, !isWhiteTurn);
    game.undo();

    if (isWhiteTurn) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestValue);
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
      beta = Math.min(beta, bestValue);
    }
  }

  const endTime = performance.now();
  console.log(`[AI] Best Move: ${bestMove}, Value: ${bestValue}, Nodes: ${nodesExplored}, Time: ${(endTime - startTime).toFixed(2)}ms`);

  return bestMove || potentialMoves[Math.floor(Math.random() * potentialMoves.length)];
};
