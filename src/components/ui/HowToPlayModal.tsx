import React, { useState } from 'react';
import { X, Shield, Swords, Award, HelpCircle, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pieces' | 'rules' | 'tactics'>('pieces');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0">
          <div>
            <h2
              className="text-lg font-bold text-white tracking-wide"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              HOW TO PLAY TEKNOVA CHESS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Tactical manual & comprehensive rulebook</p>
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

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 my-4 shrink-0 text-xs">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('pieces');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'pieces'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pieces & Movement
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('rules');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Special Rules
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('tactics');
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'tactics'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tactical Principles
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'pieces' && (
            <div className="space-y-3">
              {[
                {
                  sym: '♟',
                  name: 'Pawn (1 pt)',
                  desc: 'Marches 1 square forward (or 2 on its initial deployment). Captures diagonally 1 square forward.',
                },
                {
                  sym: '♞',
                  name: 'Knight (3 pts)',
                  desc: 'Moves in an "L-shape" (2 squares straight, then 1 square perpendicular). The only piece capable of jumping over other units.',
                },
                {
                  sym: '♝',
                  name: 'Bishop (3 pts)',
                  desc: 'Travels diagonally any number of open squares. Stays strictly on squares of its initial color.',
                },
                {
                  sym: '♜',
                  name: 'Rook (5 pts)',
                  desc: 'Glides horizontally or vertically across open ranks and files. Essential for endgame control.',
                },
                {
                  sym: '♛',
                  name: 'Queen (9 pts)',
                  desc: 'Combines the infinite reach of both Rook and Bishop along ranks, files, and diagonals.',
                },
                {
                  sym: '♚',
                  name: 'King (Priceless)',
                  desc: 'Steps 1 square in any direction. Must be guarded at all costs. Never allowed to move into check.',
                },
              ].map((p) => (
                <div
                  key={p.name}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-start gap-3"
                >
                  <span className="text-3xl text-cyan-400 font-mono shrink-0 w-8 text-center">{p.sym}</span>
                  <div>
                    <h4 className="font-bold text-slate-200">{p.name}</h4>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Castling (0-0 / 0-0-0)
                </h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  A dual move relocating the King 2 squares toward a Rook while the Rook hops over. Conditions: Neither piece has moved yet, all intermediate squares are clear, and the King is neither in check nor passing through squares attacked by an enemy.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" /> En Passant ("In Passing")
                </h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  If an enemy pawn leaps 2 squares forward from its starting rank and lands directly adjacent to your pawn, you may capture it as though it had only advanced 1 square. Must be claimed on the immediate subsequent move.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Pawn Promotion
                </h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  When your pawn reaches the opponent's rear baseline (8th rank for White, 1st for Black), it immediately promotes into a Queen, Rook, Bishop, or Knight of your choice.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Checkmate vs Stalemate
                </h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  <strong className="text-slate-100">Checkmate:</strong> King is under direct attack and has no legal escape path. Game is won immediately.
                  <br />
                  <strong className="text-slate-100">Stalemate:</strong> Player whose turn it is has NO legal moves available, but their King is NOT in check. Results in an immediate draw (½-½).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-slate-200">1. Dominate the Central Hub (d4, e4, d5, e5)</h4>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Pieces deployed in or targeting the central quadrants command vastly superior mobility and strike angles across both wings.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-slate-200">2. Rapid Minor Piece Deployment</h4>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Deploy Knights before Bishops, don't move the same piece multiple times in the opening without reason, and avoid bringing the Queen out into enemy crossfire too early.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <h4 className="font-bold text-slate-200">3. Secure the Royal Command Structure</h4>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Castle early to tuck your King behind a protective wall of pawns while activating your Rook to coordinate along open files.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
