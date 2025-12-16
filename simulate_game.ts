import { Chess } from 'chess.js';
import { getBestMove } from './src/engine/ai.ts';

// Mock performance.now globally since it's used in ai.ts but not in Node by default (without perf_hooks in older node, but usually present in modern)
// We'll add a simple polyfill just in case
if (typeof performance === 'undefined') {
    (global as any).performance = { now: () => Date.now() };
}

console.log("Starting AI vs AI Simulation...");

const game = new Chess();
let moveCount = 0;
const MAX_MOVES = 200; // Prevent infinite loops

while (!game.isGameOver() && moveCount < MAX_MOVES) {
    moveCount++;
    const turn = game.turn() === 'w' ? "White" : "Black";
    
    // In our real game, AI plays Black, User plays White.
    // For simulation, we'll use the AI function for BOTH sides.
    // getBestMove handles turn perspective internally based on game.turn()
    
    // We need to capture logs from getBestMove to prevent spam, or just let them show.
    // Let's just run it.
    
    const move = getBestMove(game);
    
    if (move) {
        game.move(move);
        // console.log(`[${moveCount}] ${turn} plays ${move}`); // Optional: reduced verbosity
    } else {
        console.log("No move found! Game might be stuck or over.");
        break;
    }
}

console.log("\nSimulation Ended.");
console.log(`Total Moves: ${moveCount}`);
console.log(`Final FEN: ${game.fen()}`);
console.log(`Game Over: ${game.isGameOver()}`);
if (game.isCheckmate()) console.log(`Result: Checkmate! Winner: ${game.turn() === 'w' ? 'Black' : 'White'}`);
else if (game.isDraw()) console.log("Result: Draw");
else console.log("Result: Unknown / Max moves reached");

if (moveCount >= MAX_MOVES) {
  process.exit(1); // Fail if max moves reached (likely loop or too slow)
}
