import React, { useRef, useEffect, useState } from 'react';
import { Copy, Check, X, Share2 } from 'lucide-react';
import { MoveRecord } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface MoveHistoryProps {
  history: MoveRecord[];
  currentFen: string;
  onClose: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentFen,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);

  // Group moves into pairs: [ { moveNum: 1, white: 'e4', black: 'e5' } ]
  const movePairs: { moveNum: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNum: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Auto scroll to bottom when new move arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const generatePgn = () => {
    let pgn = '';
    movePairs.forEach((pair) => {
      pgn += `${pair.moveNum}. ${pair.white?.san || ''} ${pair.black?.san || ''} `;
    });
    return pgn.trim();
  };

  const handleCopyPgn = () => {
    soundEngine.playClick();
    const pgn = generatePgn();
    navigator.clipboard.writeText(pgn).then(() => {
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    });
  };

  const handleCopyFen = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(currentFen).then(() => {
      setCopiedFen(true);
      setTimeout(() => setCopiedFen(false), 2000);
    });
  };

  return (
    <div className="w-72 sm:w-80 h-full max-h-[75vh] flex flex-col rounded-xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-100 font-mono">Move Notation</span>
          <span className="text-xs text-slate-500 font-mono">({history.length} ply)</span>
        </div>
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Move List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-1">
        {movePairs.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-600 text-xs italic">
            No moves recorded yet
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.moveNum}
              className="grid grid-cols-[36px_1fr_1fr] py-1 px-2 rounded hover:bg-slate-900/60 transition-colors text-slate-300 items-center"
            >
              <span className="text-slate-500">{pair.moveNum}.</span>
              <span className="font-medium text-slate-200">{pair.white?.san || ''}</span>
              <span className="text-cyan-300/90">{pair.black?.san || ''}</span>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={handleCopyPgn}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedPgn ? 'PGN Copied' : 'Copy PGN'}</span>
        </button>

        <button
          onClick={handleCopyFen}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {copiedFen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedFen ? 'FEN Copied' : 'Copy FEN'}</span>
        </button>
      </div>
    </div>
  );
};
