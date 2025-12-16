import { Chess } from 'chess.js';

const game = new Chess();
const moves = game.moves();

console.log("Initial Board State:");
console.log(game.ascii());
console.log("\nLegal Moves for White from Initial Position:");
console.log(moves);

// Verify specific piece types
const pawns = moves.filter(m => m.includes('a3') || m.includes('a4') || m.length === 2); // Simplified check
const knights = moves.filter(m => m.includes('N'));

console.log(`\nTotal Legal Moves: ${moves.length}`);
console.log(`Pawn Moves: ${moves.filter(m => !m.includes('N')).join(', ')}`);
console.log(`Knight Moves: ${knights.join(', ')}`);
