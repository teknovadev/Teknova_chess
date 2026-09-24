export type GameMode = 'pvp' | 'ai';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type CameraView = 'white' | 'black' | 'top' | 'isometric';

export type TimeControlKey = 'unlimited' | 'blitz' | 'rapid' | 'classical';

export interface TimeControlConfig {
  key: TimeControlKey;
  label: string;
  initialSeconds: number; // 0 for unlimited
  incrementSeconds: number;
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  color: PieceColor;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  timestamp: number;
}

export interface CapturedPiecesCount {
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  showHighlights: boolean;
  showCoordinates: boolean;
  boardGlow: boolean;
  animationSpeed: 'instant' | 'fast' | 'normal' | 'cinematic';
  autoRotateTurn: boolean;
}

export interface PromotionRequest {
  from: string;
  to: string;
  color: PieceColor;
}
