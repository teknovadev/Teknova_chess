import React from 'react';
import { Volume2, VolumeX, RotateCcw, Undo2, BookOpen, Settings, Play, Home } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNewGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onUndoMove: () => void;
  onRestartGame: () => void;
  onReturnToMenu: () => void;
  canUndo: boolean;
  gameModeLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onOpenNewGame,
  onOpenHowToPlay,
  onOpenSettings,
  onUndoMove,
  onRestartGame,
  onReturnToMenu,
  canUndo,
  gameModeLabel,
}) => {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Zone 1: Single text element Brand Zone & Home Return */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => {
            soundEngine.playClick();
            onReturnToMenu();
          }}
          title="Return to Main Menu"
          aria-label="Return to Main Menu"
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <span className="font-bold text-cyan-400 font-mono text-xs sm:text-sm tracking-tighter">TN</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1 cursor-default"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              TEKNOVA <span className="text-cyan-400">CHESS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-400">
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenNewGame();
          }}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Match</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenHowToPlay();
          }}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rules & Guide</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenSettings();
          }}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <span className="hidden lg:inline-block text-xs font-mono text-slate-500 pr-2 border-r border-slate-800">
          {gameModeLabel}
        </span>

        {/* Undo button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onUndoMove();
          }}
          disabled={!canUndo}
          aria-label="Undo move"
          title="Undo move"
          className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            canUndo
              ? 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800'
              : 'border-transparent text-slate-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Restart button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onRestartGame();
          }}
          aria-label="Restart match"
          title="Restart match"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Restart</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            onToggleSound();
            soundEngine.playClick();
          }}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            soundEnabled
              ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400 hover:border-cyan-500/70'
              : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* New match mobile button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenNewGame();
          }}
          className="md:hidden px-2.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
        >
          Match
        </button>
      </div>
    </header>
  );
};
