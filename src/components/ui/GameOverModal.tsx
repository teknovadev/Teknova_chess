import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Eye, ShieldAlert } from 'lucide-react';
import { PieceColor } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  winner: PieceColor | 'draw' | null;
  reason: string;
  totalMoves: number;
  onRestart: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  totalMoves,
  onRestart,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && winner && winner !== 'draw') {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#38bdf8', '#ffffff', '#0284c7'],
        });
      } catch {
        // silent
      }
    }
  }, [isOpen, winner]);

  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const winnerTitle = isDraw
    ? 'TACTICAL STALEMATE'
    : winner === 'w'
    ? 'WHITE VICTORIOUS'
    : 'BLACK VICTORIOUS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/50 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-500/20 text-center">
        {/* Crest */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mb-4 text-cyan-400">
          {isDraw ? <ShieldAlert className="w-7 h-7" /> : <Trophy className="w-7 h-7" />}
        </div>

        <h2
          className="text-xl font-bold tracking-wider text-white"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          {winnerTitle}
        </h2>

        <p className="text-xs text-cyan-400 font-mono mt-1 capitalize">{reason}</p>

        {/* Quick Stats */}
        <div className="my-5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Total Moves</span>
            <span className="text-sm font-bold font-mono text-slate-200">{totalMoves}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Outcome</span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {isDraw ? '½ - ½' : winner === 'w' ? '1 - 0' : '0 - 1'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Examine Final Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
