import React from 'react';
import { X, Volume2, Sparkles, PlayCircle, Eye, RotateCw } from 'lucide-react';
import { GameSettings } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2
              className="text-lg font-bold text-white tracking-wide"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              SETTINGS & PREFERENCES
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize audio, visuals, and animations</p>
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

        <div className="mt-5 space-y-4 text-xs">
          {/* Audio toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Sound Effects</span>
                <span className="text-[11px] text-slate-400">Tactile moves, captures, check alerts</span>
              </div>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ soundEnabled: !settings.soundEnabled });
                soundEngine.enabled = !settings.soundEnabled;
                if (!settings.soundEnabled) soundEngine.playClick();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                  settings.soundEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Highlights toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Tactical Highlights</span>
                <span className="text-[11px] text-slate-400">Show legal moves, captures, and last move</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ showHighlights: !settings.showHighlights });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.showHighlights ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                  settings.showHighlights ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Board Glow */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Electric Underglow</span>
                <span className="text-[11px] text-slate-400">TekNova neon perimeter lighting</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ boardGlow: !settings.boardGlow });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.boardGlow ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                  settings.boardGlow ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Animation Speed */}
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Piece Animation Speed</span>
                <span className="text-[11px] text-slate-400">Duration of piece transit arcs</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['instant', 'fast', 'normal', 'cinematic'] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSettings({ animationSpeed: spd });
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-center capitalize transition-colors cursor-pointer ${
                    settings.animationSpeed === spd
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* Auto rotate camera */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                <RotateCw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Auto-Flip on Turn (PvP)</span>
                <span className="text-[11px] text-slate-400">Rotate perspective for pass & play</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ autoRotateTurn: !settings.autoRotateTurn });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.autoRotateTurn ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                  settings.autoRotateTurn ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
