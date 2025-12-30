/**
 * Converts PGN standard game result notation to user-friendly display text.
 * 
 * @param pgnResult - PGN notation: "1-0" (White wins), "0-1" (Black wins), "1/2-1/2" (Draw)
 * @param userId - The current user's ID
 * @param whiteId - The white player's ID
 * @param blackId - The black player's ID
 * @returns User-friendly result string: "Win", "Loss", or "Draw"
 */
export const getUserResultFromPgn = (
    pgnResult: string,
    userId: number,
    whiteId: number | null,
    blackId: number | null
): 'Win' | 'Loss' | 'Draw' => {
    if (pgnResult === '1/2-1/2') {
        return 'Draw';
    }

    const isUserWhite = whiteId === userId;
    const isUserBlack = blackId === userId;

    if (pgnResult === '1-0') {
        // White wins
        return isUserWhite ? 'Win' : 'Loss';
    } else if (pgnResult === '0-1') {
        // Black wins
        return isUserBlack ? 'Win' : 'Loss';
    }

    // Fallback for unknown formats
    return 'Draw';
};
