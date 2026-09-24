import React from 'react';
import { Eye, RotateCw, ListOrdered, Maximize2, Minimize2 } from 'lucide-react';
import { CameraView } from '../../types/chess';
import { soundEngine } from '../../utils/audio';

interface ControlsHUDProps {
  cameraView: CameraView;
  onChangeCameraView: (view: CameraView) => void;
  onResetCamera: () => void;
  onToggleMoveHistory: () => void;
  showMoveHistory: boolean;
}

export const ControlsHUD: React.FC<ControlsHUDProps> = ({
  cameraView,
  onChangeCameraView,
  onResetCamera,
  onToggleMoveHistory,
  showMoveHistory,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-md shadow-xl text-xs z-10 pointer-events-auto">
      {/* Camera Angle Segmented Tabs */}
      <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => {
            soundEngine.playClick();
            onChangeCameraView('white');
          }}
          title="White Viewpoint"
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            cameraView === 'white'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          White
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onChangeCameraView('black');
          }}
          title="Black Viewpoint"
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            cameraView === 'black'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Black
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onChangeCameraView('top');
          }}
          title="Top-Down Tactical View"
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            cameraView === 'top'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Top
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            onChangeCameraView('isometric');
          }}
          title="Isometric View"
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            cameraView === 'isometric'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Iso
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-800" />

      {/* Reset Camera Orbit */}
      <button
        onClick={() => {
          soundEngine.playClick();
          onResetCamera();
        }}
        title="Reset Camera Angle"
        className="p-1.5 rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>

      {/* Move History Drawer Toggle */}
      <button
        onClick={() => {
          soundEngine.playClick();
          onToggleMoveHistory();
        }}
        title="Toggle Move History"
        className={`px-2 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
          showMoveHistory
            ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
            : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
        }`}
      >
        <ListOrdered className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Moves</span>
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        className="p-1.5 rounded-lg border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
