import { Chess } from 'chess.js';

const game = new Chess();
console.log("Testing move e2 -> e4 with promotion: 'q'...");

try {
    const result = game.move({ from: 'e2', to: 'e4', promotion: 'q' });
    console.log("Move successful:", result);
} catch (e) {
    console.error("Move failed with error:", e.message);
}

console.log("\nTesting move e2 -> e4 WITHOUT promotion...");
const game2 = new Chess();
try {
    const result = game2.move({ from: 'e2', to: 'e4' });
    console.log("Move successful:", result);
} catch (e) {
    console.error("Move failed:", e.message);
}
