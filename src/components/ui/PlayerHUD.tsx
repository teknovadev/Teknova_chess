import React from 'react';
import { Bot, User, Clock, AlertCircle } from 'lucide-react';
import { CapturedPiecesCount, PieceColor } from '../../types/chess';

interface PlayerHUDProps {
  color: PieceColor;
  name: string;
  isAI: boolean;
  aiDifficulty?: string;
  isTurn: boolean;
  isCheck: boolean;
  timeRemaining: number; // in seconds, -1 if unlimited
  captured: CapturedPiecesCount;
  materialAdvantage: number; // positive if this player has advantage
  isThinking?: boolean;
}

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
};

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  color,
  name,
  isAI,
  aiDifficulty,
  isTurn,
  isCheck,
  timeRemaining,
  captured,
  materialAdvantage,
  isThinking = false,
}) => {
  const isWhite = color === 'w';

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    if (seconds < 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining > 0 && timeRemaining <= 30;

  // Flatten captured pieces list for rendering
  const capturedList: { type: string; count: number }[] = [
    { type: 'q', count: captured.q },
    { type: 'r', count: captured.r },
    { type: 'b', count: captured.b },
    { type: 'n', count: captured.n },
    { type: 'p', count: captured.p },
  ].filter((item) => item.count > 0);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 px-3.5 py-2.5 backdrop-blur-md ${
        isTurn
          ? 'border-cyan-500/60 bg-slate-900/90 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
          : 'border-slate-800/80 bg-slate-950/70 text-slate-400'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isWhite
                ? 'bg-slate-200 border-slate-300 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-cyan-400'
            }`}
          >
            {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold truncate text-slate-100">
                {name}
              </span>
              {aiDifficulty && (
                <span className="text-[10px] font-mono text-cyan-400 capitalize">
                  {aiDifficulty}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="capitalize">{isWhite ? 'White' : 'Black'}</span>
              {isTurn && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400 font-medium">
                    {isThinking ? 'Calculating move…' : 'Active turn'}
                  </span>
                </>
              )}
              {isCheck && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-400 font-medium flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Check
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timer Clock */}
        {timeRemaining >= 0 && (
          <div
            className={`flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded-md border tabular-nums ${
              isLowTime
                ? 'border-rose-500/60 bg-rose-950/40 text-rose-400 animate-pulse'
                : isTurn
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Bottom Tray: Captured pieces & Material lead */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between min-h-[22px] text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {capturedList.length === 0 ? (
            <span className="text-[11px] text-slate-600 italic">No captures</span>
          ) : (
            capturedList.map((item) => (
              <span
                key={item.type}
                className="text-xs text-slate-300 flex items-center font-mono"
                title={`${item.count} captured`}
              >
                <span>{PIECE_SYMBOLS[item.type]}</span>
                {item.count > 1 && (
                  <span className="text-[10px] text-cyan-400 ml-0.5 font-bold">×{item.count}</span>
                )}
              </span>
            ))
          )}
        </div>

        {materialAdvantage > 0 && (
          <span className="text-[11px] font-mono font-semibold text-cyan-400 shrink-0">
            +{materialAdvantage}
          </span>
        )}
      </div>
    </div>
  );
};
