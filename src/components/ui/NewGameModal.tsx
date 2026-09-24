import React, { useState } from 'react';
import { X, Bot, Users, Sparkles, Clock, ShieldCheck, Zap, Swords } from 'lucide-react';
import { GameMode, AIDifficulty, PieceColor, TimeControlKey } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: {
    mode: GameMode;
    difficulty: AIDifficulty;
    playerColor: PieceColor;
    timeControl: TimeControlKey;
  }) => void;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  currentPlayerColor: PieceColor;
  currentTimeControl: TimeControlKey;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentMode,
  currentDifficulty,
  currentPlayerColor,
  currentTimeControl,
}) => {
  const [mode, setMode] = useState<GameMode>(currentMode);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(currentDifficulty);
  const [playerColor, setPlayerColor] = useState<PieceColor>(currentPlayerColor);
  const [timeControl, setTimeControl] = useState<TimeControlKey>(currentTimeControl);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onStartGame({
      mode,
      difficulty,
      playerColor,
      timeControl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/20 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2
              className="text-lg font-bold text-white tracking-wide"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              DEPLOY NEW MATCH
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure tactical simulation parameters</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Game Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Game Mode</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMode('ai');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'ai'
                    ? 'border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bot className={`w-4 h-4 ${mode === 'ai' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold">Player vs AI</span>
                </div>
                <p className="text-[11px] text-slate-400">Battle against the TekNova tactical engine</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMode('pvp');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'pvp'
                    ? 'border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className={`w-4 h-4 ${mode === 'pvp' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold">Pass & Play</span>
                </div>
                <p className="text-[11px] text-slate-400">Two players on the same screen</p>
              </button>
            </div>
          </div>

          {/* AI Settings (Only in AI Mode) */}
          {mode === 'ai' && (
            <>
              {/* Difficulty */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">AI Protocol Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'easy', label: 'Easy', desc: 'Fast heuristic', icon: Zap },
                    { key: 'medium', label: 'Medium', desc: 'Minimax d=2', icon: ShieldCheck },
                    { key: 'hard', label: 'Hard', desc: 'Alpha-Beta d=3', icon: Swords },
                  ].map((tier) => {
                    const Icon = tier.icon;
                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setDifficulty(tier.key as AIDifficulty);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          difficulty === tier.key
                            ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/30'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-bold">{tier.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{tier.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Side */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Play As</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPlayerColor('w');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      playerColor === 'w'
                        ? 'border-cyan-500 bg-white text-slate-950 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-400 inline-block" />
                    <span>White (First)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPlayerColor('b');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      playerColor === 'b'
                        ? 'border-cyan-500 bg-slate-900 text-cyan-300 ring-1 ring-cyan-500 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 inline-block" />
                    <span>Black (Second)</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Time Control */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Time Control</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'unlimited', label: 'Casual', sub: 'No timer' },
                { key: 'blitz', label: '3 min', sub: 'Blitz' },
                { key: 'rapid', label: '10 min', sub: 'Rapid' },
                { key: 'classical', label: '15 min', sub: 'Standard' },
              ].map((tc) => (
                <button
                  key={tc.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTimeControl(tc.key as TimeControlKey);
                  }}
                  className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                    timeControl === tc.key
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{tc.label}</span>
                  <span className="text-[10px] text-slate-500 block">{tc.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="w-1/3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
