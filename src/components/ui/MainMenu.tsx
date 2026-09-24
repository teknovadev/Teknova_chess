import React, { useEffect, useRef, useState } from 'react';
import { Bot, Users, BookOpen, Settings, Volume2, VolumeX, Shield, Swords, Zap, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { GameMode, AIDifficulty, PieceColor, TimeControlKey } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface MainMenuProps {
  onStartMatch: (config: {
    mode: GameMode;
    difficulty: AIDifficulty;
    playerColor: PieceColor;
    timeControl: TimeControlKey;
  }) => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hasActiveGame?: boolean;
  onResumeGame?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartMatch,
  onOpenHowToPlay,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  hasActiveGame = false,
  onResumeGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showAISetup, setShowAISetup] = useState(false);
  const [showPvPSetup, setShowPvPSetup] = useState(false);

  // Setup state for AI match
  const [aiColor, setAiColor] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [aiTime, setAiTime] = useState<TimeControlKey>('unlimited');

  // Setup state for PvP match
  const [pvpTime, setPvpTime] = useState<TimeControlKey>('unlimited');

  // Subtle futuristic background canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep radial gradient backdrop
      const grad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        50,
        width / 2,
        height * 0.45,
        Math.max(width, height) * 0.75
      );
      grad.addColorStop(0, '#0a152e');
      grad.addColorStop(0.5, '#040915');
      grad.addColorStop(1, '#02040a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Perspective grid floor at the bottom
      ctx.save();
      const horizonY = height * 0.65;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
      ctx.lineWidth = 1;

      // Vertical perspective lines
      const cx = width / 2;
      for (let i = -16; i <= 16; i++) {
        const spread = (i * width) / 10;
        ctx.beginPath();
        ctx.moveTo(cx + spread * 0.05, horizonY);
        ctx.lineTo(cx + spread * 1.5, height);
        ctx.stroke();
      }

      // Horizontal lines with exponential spacing
      for (let y = horizonY; y < height; y += (y - horizonY + 8) * 0.18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Connect particles with faint glowing circuit lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        p1.pulse += 0.02;

        if (p1.x < 0) p1.x = width;
        if (p1.x > width) p1.x = 0;
        if (p1.y < 0) p1.y = height;
        if (p1.y > height) p1.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - dist / 130) * 0.12})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw particle dot
        const glow = 0.4 + Math.sin(p1.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${glow})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLaunchAIMatch = () => {
    soundEngine.playClick();
    setShowAISetup(false);
    onStartMatch({
      mode: 'ai',
      difficulty: aiDifficulty,
      playerColor: aiColor,
      timeControl: aiTime,
    });
  };

  const handleLaunchPvPMatch = () => {
    soundEngine.playClick();
    setShowPvPSetup(false);
    onStartMatch({
      mode: 'pvp',
      difficulty: 'medium',
      playerColor: 'w',
      timeControl: pvpTime,
    });
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between overflow-hidden bg-[#030712] text-slate-100 select-none px-4 py-6 sm:py-8">
      {/* Background Interactive Kinetic Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle top brand bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <span className="font-mono font-bold text-cyan-400 text-sm">TN</span>
            </div>
          </div>
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400/90 font-semibold">
            TekNova Systems
          </span>
        </div>

        <button
          onClick={() => {
            onToggleSound();
            soundEngine.playClick();
          }}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </header>

      {/* Main Center Menu Hero Card */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center my-auto">
        {/* Glowing holographic icon emblem */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/40 to-slate-950/90 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl select-none filter drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
              ♞
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 drop-shadow-sm"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          TEKNOVA CHESS
        </h1>

        <p className="mt-1.5 text-xs sm:text-sm font-medium tracking-wide text-cyan-400/90 uppercase font-mono">
          3D Chess Experience
        </p>

        {/* Action Buttons Menu Group */}
        <div className="w-full mt-7 sm:mt-8 space-y-3">
          {/* Resume game button if one is in progress */}
          {hasActiveGame && onResumeGame && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onResumeGame();
              }}
              className="w-full py-3.5 px-5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-950/60 text-white font-semibold text-sm transition-all flex items-center justify-between shadow-lg shadow-emerald-950/30 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-emerald-400 group-hover:rotate-[-45deg] transition-transform" />
                <span className="tracking-wide">Resume Current Match</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Button 1: Play vs AI */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowAISetup(true);
            }}
            className="w-full py-3.5 px-5 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/50 via-slate-900/80 to-blue-950/50 hover:border-cyan-400 hover:from-cyan-900/60 hover:to-blue-900/60 text-white font-semibold text-sm sm:text-base transition-all flex items-center justify-between shadow-xl shadow-cyan-950/20 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="tracking-wide font-bold">Play vs AI</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  Challenge Easy, Medium, or Hard AI
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: Play vs Player */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowPvPSetup(true);
            }}
            className="w-full py-3.5 px-5 rounded-xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900/90 hover:border-cyan-500/40 text-slate-200 hover:text-white font-semibold text-sm sm:text-base transition-all flex items-center justify-between shadow-lg shadow-black/40 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="tracking-wide font-bold">Play vs Player</div>
                <div className="text-[11px] text-slate-400 font-normal">
                  Pass & Play on the same screen
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Secondary Buttons Row: How to Play & Settings */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenHowToPlay();
              }}
              className="py-3 px-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>How to Play</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenSettings();
              }}
              className="py-3 px-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full max-w-5xl flex items-center justify-center text-center">
        <p className="text-xs text-slate-400 font-mono tracking-wider">
          TekNova Chess by TekNova <span className="text-slate-600">·</span> 3D Precision Tactical Engine
        </p>
      </footer>

      {/* AI MATCH SETUP DIALOG */}
      {showAISetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/30 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-base sm:text-lg font-bold text-white tracking-wide"
                    style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                  >
                    AI MATCH SETUP
                  </h3>
                  <p className="text-xs text-slate-400">Configure side and AI protocol</p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowAISetup(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Choose Side: White vs Black */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Choose Your Side
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setAiColor('w');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      aiColor === 'w'
                        ? 'border-cyan-400 bg-cyan-950/40 text-white ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
                      <span className="text-xs font-bold text-white">White Pieces</span>
                    </div>
                    <p className="text-[11px] text-cyan-400/90 font-medium">You move first</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setAiColor('b');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      aiColor === 'b'
                        ? 'border-cyan-400 bg-cyan-950/40 text-white ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-cyan-500/80 shadow-sm" />
                      <span className="text-xs font-bold text-white">Black Pieces</span>
                    </div>
                    <p className="text-[11px] text-cyan-400/90 font-medium">AI moves first</p>
                  </button>
                </div>
              </div>

              {/* AI Protocol / Difficulty */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  AI Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'easy', label: 'Easy', desc: 'Tactical intro', icon: Zap },
                    { key: 'medium', label: 'Medium', desc: 'Balanced minimax', icon: Shield },
                    { key: 'hard', label: 'Hard', desc: 'Deep Alpha-Beta', icon: Swords },
                  ].map((tier) => {
                    const Icon = tier.icon;
                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setAiDifficulty(tier.key as AIDifficulty);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          aiDifficulty === tier.key
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400/40'
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

              {/* Time Control */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Time Control
                </label>
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
                        setAiTime(tc.key as TimeControlKey);
                      }}
                      className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        aiTime === tc.key
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400/40'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{tc.label}</span>
                      <span className="text-[10px] text-slate-500 block">{tc.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAISetup(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchAIMatch}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start AI Match</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PVP MATCH SETUP DIALOG */}
      {showPvPSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/30 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-base sm:text-lg font-bold text-white tracking-wide"
                    style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                  >
                    PASS & PLAY SETUP
                  </h3>
                  <p className="text-xs text-slate-400">Two players on the same device</p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowPvPSetup(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Time Control */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Time Control
                </label>
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
                        setPvpTime(tc.key as TimeControlKey);
                      }}
                      className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        pvpTime === tc.key
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400/40'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{tc.label}</span>
                      <span className="text-[10px] text-slate-500 block">{tc.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-1">
                <p className="text-slate-300 font-medium">Standard Chess Rules Enforced:</p>
                <p>White moves first. Enable turn auto-rotation in Settings if players sit opposite each other.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPvPSetup(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchPvPMatch}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Pass & Play</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
