import React from 'react';
import { PieceType, PieceColor } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface PromotionModalProps {
  color: PieceColor;
  onSelectPiece: (piece: PieceType) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  onSelectPiece,
}) => {
  const pieces: { type: PieceType; name: string; symbol: string; desc: string }[] = [
    { type: 'q', name: 'Queen', symbol: '♛', desc: 'Maximum tactical mobility' },
    { type: 'n', name: 'Knight', symbol: '♞', desc: 'Unorthodox fork potential' },
    { type: 'r', name: 'Rook', symbol: '♜', desc: 'Heavy open file control' },
    { type: 'b', name: 'Bishop', symbol: '♝', desc: 'Long-range diagonal sniper' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-500/10 text-center">
        <h3
          className="text-lg font-bold text-white tracking-wide"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          PAWN PROMOTION
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Choose which tactical unit to deploy for your advanced pawn
        </p>

        <div className="grid grid-cols-2 gap-3">
          {pieces.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                soundEngine.playClick();
                onSelectPiece(item.type);
              }}
              className="flex flex-col items-center p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/70 hover:bg-cyan-950/20 text-slate-200 transition-all hover:scale-[1.02] cursor-pointer group"
            >
              <span className="text-4xl mb-1 text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                {item.symbol}
              </span>
              <span className="text-sm font-bold text-slate-100">{item.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
