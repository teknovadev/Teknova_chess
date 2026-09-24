import { Chess, Move } from 'chess.js';
import { AIDifficulty } from '../types/chess';

// Standard piece values (centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (White perspective; flipped for Black)
// High values encourage good strategic piece placement (center control, king safety, knight outposts)
const PST_PAWN: number[][] = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const PST_KNIGHT: number[][] = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const PST_BISHOP: number[][] = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const PST_ROOK: number[][] = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0],
];

const PST_QUEEN: number[][] = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const PST_KING_MID: number[][] = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20],
];

function getPieceSquareValue(pieceType: string, row: number, col: number, isWhite: boolean): number {
  const r = isWhite ? row : 7 - row;
  const c = isWhite ? col : 7 - col;

  switch (pieceType) {
    case 'p': return PST_PAWN[r]?.[c] ?? 0;
    case 'n': return PST_KNIGHT[r]?.[c] ?? 0;
    case 'b': return PST_BISHOP[r]?.[c] ?? 0;
    case 'r': return PST_ROOK[r]?.[c] ?? 0;
    case 'q': return PST_QUEEN[r]?.[c] ?? 0;
    case 'k': return PST_KING_MID[r]?.[c] ?? 0;
    default: return 0;
  }
}

/**
 * Static evaluation function of the board position from White's perspective.
 * Positive = White is winning, Negative = Black is winning.
 */
function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceVal = PIECE_VALUES[piece.type] || 0;
      const isWhite = piece.color === 'w';
      const positionalVal = getPieceSquareValue(piece.type, r, c, isWhite);
      const totalPieceVal = pieceVal + positionalVal;

      if (isWhite) {
        score += totalPieceVal;
      } else {
        score -= totalPieceVal;
      }
    }
  }

  // Bonus for active mobility (number of legal moves)
  const currentTurn = chess.turn();
  const mobility = chess.moves().length;
  score += (currentTurn === 'w' ? 1 : -1) * (mobility * 4);

  return score;
}

/**
 * Move ordering for faster alpha-beta cutoffs:
 * Checks & high-value captures first (MVV-LVA)
 */
function scoreMoveForOrdering(move: Move): number {
  let score = 0;
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 0;
    const attackerVal = PIECE_VALUES[move.piece] || 0;
    score += victimVal * 10 - attackerVal;
  }
  if (move.promotion) {
    score += 800;
  }
  if (move.san.includes('+')) {
    score += 150;
  }
  return score;
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Select the best move for the AI given difficulty
 */
export async function getAIMove(
  fen: string,
  difficulty: AIDifficulty
): Promise<Move | null> {
  return new Promise((resolve) => {
    // Keep UI smooth with slight deliberate delay so move doesn't feel instantaneous
    const thinkDelay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 450 : 600;

    setTimeout(() => {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length === 0) {
        resolve(null);
        return;
      }

      const isWhite = chess.turn() === 'w';

      // EASY DIFFICULTY:
      // Depth 1, 35% chance to pick random move or high-level tactical move
      if (difficulty === 'easy') {
        const isRandom = Math.random() < 0.35;
        if (isRandom) {
          const randomIndex = Math.floor(Math.random() * legalMoves.length);
          resolve(legalMoves[randomIndex]);
          return;
        }

        // Otherwise pick simplest high-value capture or safe move
        let bestMove = legalMoves[0];
        let bestScore = isWhite ? -Infinity : Infinity;

        for (const move of legalMoves) {
          chess.move(move);
          const score = evaluateBoard(chess);
          chess.undo();

          if (isWhite ? score > bestScore : score < bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        resolve(bestMove);
        return;
      }

      // MEDIUM DIFFICULTY:
      // Depth 2 minimax
      if (difficulty === 'medium') {
        const depth = 2;
        let bestMove = legalMoves[0];
        let bestScore = isWhite ? -Infinity : Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        legalMoves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

        for (const move of legalMoves) {
          chess.move(move);
          const score = minimax(chess, depth - 1, alpha, beta, !isWhite);
          chess.undo();

          if (isWhite) {
            if (score > bestScore) {
              bestScore = score;
              bestMove = move;
            }
            alpha = Math.max(alpha, bestScore);
          } else {
            if (score < bestScore) {
              bestScore = score;
              bestMove = move;
            }
            beta = Math.min(beta, bestScore);
          }
        }
        resolve(bestMove);
        return;
      }

      // HARD DIFFICULTY:
      // Depth 3 search with alpha-beta and tactical ordering
      const depth = 3;
      let bestMove = legalMoves[0];
      let bestScore = isWhite ? -Infinity : Infinity;
      let alpha = -Infinity;
      let beta = Infinity;

      legalMoves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

      for (const move of legalMoves) {
        chess.move(move);
        const score = minimax(chess, depth - 1, alpha, beta, !isWhite);
        chess.undo();

        if (isWhite) {
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
          alpha = Math.max(alpha, bestScore);
        } else {
          if (score < bestScore) {
            bestScore = score;
            bestMove = move;
          }
          beta = Math.min(beta, bestScore);
        }
      }

      resolve(bestMove);
    }, thinkDelay);
  });
}
