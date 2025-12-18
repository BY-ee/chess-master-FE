
// Simple Opening Book
// Keys: FEN strings (shortened to piece placement + active color + castling + en passant) to avoid halfmove/fullmove clock mismatches.
// Values: Array of moves (SAN). One move can appear multiple times to increase probability.

// Helper to normalize FEN for lookup
// We only care about: Piece Placement, Active Color, Castling Availability
// We IGNORE En Passant for opening book lookup to maximize hit rate.
export const normalizeFen = (fen: string): string => {
  return fen.split(' ').slice(0, 3).join(' ');
};

const OPENING_BOOK: Record<string, string[]> = {
  // ------------ 1. (White) ------------ //
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': [
    'e4', 'e4', 'e4', 'e4', // King's Pawn
    'd4', 'd4', 'd4',       // Queen's Pawn
    'Nf3', 'Nf3',           // Reti/Zukertort
    'c4',                   // English
  ],

  // ------------ 1. (Black) ------------ //
  // 1. e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': [
    'e5', 'e5', 'e5',   // Open Game
    'c5', 'c5', 'c5',   // Sicilian Defense
    'e6', 'e6',         // French Defense
    'c6',               // Caro-Kann
    'd5',               // Scandinavian
    'd6',               // Pirc
    'Nf6',              // Alekhine
  ],

  // 1. d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq': [
    'd5', 'd5', 'd5',   // Closed Game
    'Nf6', 'Nf6',       // Indian Defenses
    'f5',               // Dutch
    'e6',
  ],

  // 1. Nf3
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq': [
    'd5',
    'Nf6',
    'c5',
    'e6',
    'g6',
  ],

  // 1. c4
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq': [
    'e5',
    'c5',
    'Nf6',
    'e6',
  ],

  // ------------ 2. (White) ------------ //
  // 1. e4 e5 (Open Game)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'Nf3', 'Nf3', 'Nf3', // King's Knight
    'Nc3',               // Vienna
    'f4',                // King's Gambit
    'Bc4',               // Bishop's Opening
  ],

  // 1. e4 c5 (Sicilian Defense)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'Nf3', 'Nf3', 'Nf3', // Open Sicilian mainly
    'Nc3',               // Closed Sicilian
    'c3',                // Alapin
    'd4',                // Smith-Morra (roughly)
  ],

  // 1. e4 e6 (French Defense)
  'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'd4', 'd4', 'd4',
    'd3',             // King's Indian Attack
  ],

  // 1. d4 d5 (Queen's Gambit)
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    'c4', 'c4', 'c4', // Queen's Gambit
    'Nf3',            // London/Colle etc
    'Bf4',            // London
  ],

  // 1. d4 Nf6 (Indian Defense)
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    'c4', 'c4', 'c4',
    'Nf3',
    'Bg5',
  ],

  // ------------ 2. (Black) ------------ //
  // 1. e4 e5 2. Nf3 (King's Knight Opening)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    'Nc6', 'Nc6', 'Nc6', 'Nc6', // Main Line
    'd6', 'd6',                 // Philidor Defense
    'Nf6',                      // Petrov's Defense
    'f6',                       // Damiano Defense
  ],


  // 1. d4 d5 2. c4 (Queen's Gambit Accepted/Declined)
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    'e6', 'e6',         // QGD
    'c6',               // Slav
    'dxc4',             // QGA
  ],

  // ------------ 3. (White) ------------ //
  // 1.e4 e6 2. d4 d5 (French Defense)
  'rnbqkbnr/pppp1ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq': [
    'e5',    // Advanced
    'Nc3',   // Classical
    'Nd2',   // Modern
    'exd5',  // Exchange
  ],
};

export const getBookMove = (fen: string): string | null => {
  const normalized = normalizeFen(fen);
  const moves = OPENING_BOOK[normalized];
  if (!moves || moves.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * moves.length);
  return moves[randomIndex];
};
