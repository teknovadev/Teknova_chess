import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import {
  GameMode,
  AIDifficulty,
  PieceColor,
  PieceType,
  CameraView,
  TimeControlKey,
  GameSettings,
  MoveRecord,
  CapturedPiecesCount,
  PromotionRequest,
} from './types/chess';
import { soundEngine } from './utils/audio';
import { getAIMove } from './utils/ai';
import { ChessScene } from './components/chess3d/ChessScene';
import { MainMenu } from './components/ui/MainMenu';
import { Header } from './components/ui/Header';
import { PlayerHUD } from './components/ui/PlayerHUD';
import { ControlsHUD } from './components/ui/ControlsHUD';
import { MoveHistory } from './components/ui/MoveHistory';
import { PromotionModal } from './components/ui/PromotionModal';
import { NewGameModal } from './components/ui/NewGameModal';
import { GameOverModal } from './components/ui/GameOverModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { HowToPlayModal } from './components/ui/HowToPlayModal';

const TIME_LIMITS: Record<TimeControlKey, number> = {
  unlimited: -1,
  blitz: 180, // 3 mins
  rapid: 600, // 10 mins
  classical: 900, // 15 mins
};

export default function App() {
  // Navigation Screen State: 'menu' (default per requirement) | 'game'
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [matchId, setMatchId] = useState<number>(1);

  // Chess Core Instance
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());

  // Game Settings & Modes
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [timeControl, setTimeControl] = useState<TimeControlKey>('unlimited');

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(TIME_LIMITS.unlimited);
  const [blackTime, setBlackTime] = useState<number>(TIME_LIMITS.unlimited);

  // Interaction & Highlights
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [history, setHistory] = useState<MoveRecord[]>([]);

  // State flags
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [promotionRequest, setPromotionRequest] = useState<PromotionRequest | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{
    winner: PieceColor | 'draw' | null;
    reason: string;
  } | null>(null);

  // Camera & View
  const [cameraView, setCameraView] = useState<CameraView>('white');
  const [showMoveHistory, setShowMoveHistory] = useState(false);

  // Modals
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User Preferences
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    showHighlights: true,
    showCoordinates: true,
    boardGlow: true,
    animationSpeed: 'normal',
    autoRotateTurn: false,
  });

  const chess = chessRef.current;
  const currentTurn = chess.turn() as PieceColor;
  const isGameOver = chess.isGameOver() || gameOverInfo !== null;

  // Sound Engine sync
  useEffect(() => {
    soundEngine.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Calculate Captured Pieces & Material Balance
  const { whiteCaptured, blackCaptured, materialAdvantage } = useMemo(() => {
    const board = chess.board();
    const countPieces = (color: PieceColor) => {
      const counts: CapturedPiecesCount = { p: 0, n: 0, b: 0, r: 0, q: 0 };
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.color === color) {
            if (piece.type in counts) {
              counts[piece.type as keyof CapturedPiecesCount]++;
            }
          }
        }
      }
      return counts;
    };

    const currentWhite = countPieces('w');
    const currentBlack = countPieces('b');

    // Initial piece distribution
    const initialCounts: CapturedPiecesCount = { p: 8, n: 2, b: 2, r: 2, q: 1 };

    // White pieces captured by Black
    const whitePiecesCapturedByBlack: CapturedPiecesCount = {
      p: Math.max(0, initialCounts.p - currentWhite.p),
      n: Math.max(0, initialCounts.n - currentWhite.n),
      b: Math.max(0, initialCounts.b - currentWhite.b),
      r: Math.max(0, initialCounts.r - currentWhite.r),
      q: Math.max(0, initialCounts.q - currentWhite.q),
    };

    // Black pieces captured by White
    const blackPiecesCapturedByWhite: CapturedPiecesCount = {
      p: Math.max(0, initialCounts.p - currentBlack.p),
      n: Math.max(0, initialCounts.n - currentBlack.n),
      b: Math.max(0, initialCounts.b - currentBlack.b),
      r: Math.max(0, initialCounts.r - currentBlack.r),
      q: Math.max(0, initialCounts.q - currentBlack.q),
    };

    // Material valuation: P=1, N=3, B=3, R=5, Q=9
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let whiteVal = 0;
    let blackVal = 0;
    (Object.keys(values) as (keyof CapturedPiecesCount)[]).forEach((type) => {
      whiteVal += currentWhite[type] * values[type];
      blackVal += currentBlack[type] * values[type];
    });

    return {
      whiteCaptured: blackPiecesCapturedByWhite,
      blackCaptured: whitePiecesCapturedByBlack,
      materialAdvantage: whiteVal - blackVal,
    };
  }, [chess, fen]);

  // Chess Clock Interval
  useEffect(() => {
    if (screen !== 'game' || timeControl === 'unlimited' || isGameOver || isAIThinking) return;

    const timer = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameOverInfo({ winner: 'b', reason: 'White ran out of time' });
            soundEngine.playCheckmate();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameOverInfo({ winner: 'w', reason: 'Black ran out of time' });
            soundEngine.playCheckmate();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, currentTurn, timeControl, isGameOver, isAIThinking]);

  // Check Game State Status
  const evaluateGameStatus = useCallback(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'b' : 'w';
      setGameOverInfo({ winner, reason: 'Checkmate' });
      soundEngine.playCheckmate();
    } else if (chess.isStalemate()) {
      setGameOverInfo({ winner: 'draw', reason: 'Stalemate - No legal moves' });
      soundEngine.playCheck();
    } else if (chess.isThreefoldRepetition()) {
      setGameOverInfo({ winner: 'draw', reason: 'Threefold repetition' });
    } else if (chess.isInsufficientMaterial()) {
      setGameOverInfo({ winner: 'draw', reason: 'Draw by insufficient material' });
    } else if (chess.isDraw()) {
      setGameOverInfo({ winner: 'draw', reason: '50-move rule draw' });
    } else if (chess.isCheck()) {
      soundEngine.playCheck();
    }
  }, [chess]);

  // Execute Move
  const executeMove = useCallback(
    (from: string, to: string, promotionPiece?: PieceType) => {
      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotionPiece || 'q',
        });

        if (!moveResult) {
          soundEngine.playIllegal();
          return false;
        }

        // Sound triggers
        if (moveResult.san.includes('#')) {
          soundEngine.playCheckmate();
        } else if (moveResult.san.includes('+')) {
          soundEngine.playCheck();
        } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
          soundEngine.playCastle();
        } else if (moveResult.captured) {
          soundEngine.playCapture();
        } else {
          soundEngine.playMove();
        }

        // Record Move
        const newRecord: MoveRecord = {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          color: moveResult.color as PieceColor,
          piece: moveResult.piece as PieceType,
          captured: moveResult.captured as PieceType | undefined,
          promotion: moveResult.promotion as PieceType | undefined,
          fen: chess.fen(),
          timestamp: Date.now(),
        };

        setHistory((prev) => [...prev, newRecord]);
        setLastMove({ from: moveResult.from, to: moveResult.to });
        setSelectedSquare(null);
        setLegalMoves([]);
        setFen(chess.fen());

        // Check if PvP turn camera auto-rotation is on
        if (gameMode === 'pvp' && settings.autoRotateTurn) {
          setCameraView(chess.turn() === 'w' ? 'white' : 'black');
        }

        evaluateGameStatus();
        return true;
      } catch {
        soundEngine.playIllegal();
        return false;
      }
    },
    [chess, gameMode, settings.autoRotateTurn, evaluateGameStatus]
  );

  // AI Turn Handler
  const triggerAIMove = useCallback(async () => {
    if (isGameOver || isAIThinking) return;
    setIsAIThinking(true);

    try {
      const aiMove = await getAIMove(chess.fen(), aiDifficulty);
      if (aiMove) {
        executeMove(aiMove.from, aiMove.to, (aiMove.promotion as PieceType) || 'q');
      }
    } finally {
      setIsAIThinking(false);
    }
  }, [chess, isGameOver, isAIThinking, aiDifficulty, executeMove]);

  // Check if it's AI's turn
  useEffect(() => {
    if (screen === 'game' && gameMode === 'ai' && !isGameOver && !isAIThinking) {
      const isAITurn = chess.turn() !== playerColor;
      if (isAITurn) {
        const timer = setTimeout(() => {
          triggerAIMove();
        }, 380);
        return () => clearTimeout(timer);
      }
    }
  }, [fen, gameMode, playerColor, isGameOver, isAIThinking, chess, matchId, screen, triggerAIMove]);

  // Handle Square Selection
  const handleSquareClick = useCallback(
    (square: string) => {
      if (isGameOver || isAIThinking) return;

      // In AI mode, block clicking if it's AI's turn
      if (gameMode === 'ai' && chess.turn() !== playerColor) return;

      // If a square is already selected
      if (selectedSquare) {
        // If clicking the same square, deselect
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        // Check if clicked square is among legal moves
        if (legalMoves.includes(square)) {
          // Check for Pawn Promotion: pawn moving to 8th rank (w) or 1st rank (b)
          const movingPiece = chess.get(selectedSquare as Square);
          if (
            movingPiece &&
            movingPiece.type === 'p' &&
            ((movingPiece.color === 'w' && square[1] === '8') ||
              (movingPiece.color === 'b' && square[1] === '1'))
          ) {
            setPromotionRequest({
              from: selectedSquare,
              to: square,
              color: movingPiece.color as PieceColor,
            });
            return;
          }

          // Normal move execution
          executeMove(selectedSquare, square);
          return;
        }
      }

      // Selecting a new square
      const pieceOnSquare = chess.get(square as Square);
      if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
        soundEngine.playClick();
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [
      chess,
      gameMode,
      playerColor,
      selectedSquare,
      legalMoves,
      isGameOver,
      isAIThinking,
      executeMove,
    ]
  );

  // Handle Promotion Selection
  const handlePromotionSelect = (piece: PieceType) => {
    if (!promotionRequest) return;
    executeMove(promotionRequest.from, promotionRequest.to, piece);
    setPromotionRequest(null);
  };

  // Start New Game
  const handleStartNewGame = (config: {
    mode: GameMode;
    difficulty: AIDifficulty;
    playerColor: PieceColor;
    timeControl: TimeControlKey;
  }) => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setGameMode(config.mode);
    setAiDifficulty(config.difficulty);
    setPlayerColor(config.playerColor);
    setTimeControl(config.timeControl);

    const initialSecs = TIME_LIMITS[config.timeControl];
    setWhiteTime(initialSecs);
    setBlackTime(initialSecs);

    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setHistory([]);
    setGameOverInfo(null);
    setIsAIThinking(false);
    setPromotionRequest(null);

    // Set camera viewpoint to matching player side
    setCameraView(config.mode === 'ai' && config.playerColor === 'b' ? 'black' : 'white');
    setMatchId((prev) => prev + 1);
    setScreen('game');
  };

  // Restart Current Game
  const handleRestartGame = () => {
    handleStartNewGame({
      mode: gameMode,
      difficulty: aiDifficulty,
      playerColor,
      timeControl,
    });
  };

  // Undo Move
  const handleUndoMove = () => {
    if (history.length === 0 || isAIThinking) return;

    if (gameMode === 'ai') {
      // Undo both AI move and Player move so it's back to Player's turn
      chess.undo();
      chess.undo();
      setHistory((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
    } else {
      chess.undo();
      setHistory((prev) => prev.slice(0, prev.length - 1));
    }

    setFen(chess.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);

    // Update last move highlight from previous history entry
    const prevHistory = history.slice(0, history.length - (gameMode === 'ai' ? 2 : 1));
    if (prevHistory.length > 0) {
      const last = prevHistory[prevHistory.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  };

  // Game Mode Label for Header
  const gameModeLabel =
    gameMode === 'ai'
      ? `AI Battle (${aiDifficulty.toUpperCase()})`
      : 'Pass & Play';

  // Determine top and bottom players based on player side
  // In Player vs AI:
  // - Top is always the AI opponent (White if player is Black; Black if player is White)
  // - Bottom is always Commander/Player (Black if player is Black; White if player is White)
  // In PvP:
  // - Top is Black, Bottom is White
  const isPlayerBlack = gameMode === 'ai' && playerColor === 'b';

  const topPlayerColor: PieceColor =
    gameMode === 'ai' ? (isPlayerBlack ? 'w' : 'b') : 'b';
  const bottomPlayerColor: PieceColor =
    gameMode === 'ai' ? (isPlayerBlack ? 'b' : 'w') : 'w';

  const topPlayerName =
    gameMode === 'ai' ? 'TekNova Core AI' : 'Black';
  const bottomPlayerName =
    gameMode === 'ai'
      ? isPlayerBlack
        ? 'Commander (Black)'
        : 'Commander (White)'
      : 'White';

  const topPlayerIsAI = gameMode === 'ai';
  const bottomPlayerIsAI = false;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#030712] overflow-hidden text-slate-100 select-none">
      {screen === 'menu' ? (
        /* MAIN MENU SCREEN */
        <MainMenu
          onStartMatch={handleStartNewGame}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() =>
            setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
          }
          hasActiveGame={history.length > 0 && !isGameOver}
          onResumeGame={() => setScreen('game')}
        />
      ) : (
        /* ACTIVE GAME SCREEN */
        <>
          {/* Top Header Bar */}
          <Header
            soundEnabled={settings.soundEnabled}
            onToggleSound={() =>
              setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
            }
            onOpenNewGame={() => setIsNewGameOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUndoMove={handleUndoMove}
            onRestartGame={handleRestartGame}
            onReturnToMenu={() => setScreen('menu')}
            canUndo={history.length > 0 && !isAIThinking}
            gameModeLabel={gameModeLabel}
          />

          {/* Main 3D Interactive Stage */}
          <main className="flex-1 relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Three.js 3D Viewport */}
            <ChessScene
              chess={chess}
              fen={fen}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              cameraView={cameraView}
              settings={settings}
              onSquareClick={handleSquareClick}
              orientation={isPlayerBlack ? 'b' : 'w'}
            />

            {/* Floating Top Player HUD (Non-intrusive banner on mobile, box on desktop) */}
            <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-4 sm:left-4 z-10 sm:w-72 pointer-events-auto">
              <PlayerHUD
                color={topPlayerColor}
                name={topPlayerName}
                isAI={topPlayerIsAI}
                aiDifficulty={topPlayerIsAI ? aiDifficulty : undefined}
                isTurn={currentTurn === topPlayerColor && !isGameOver}
                isCheck={chess.isCheck() && currentTurn === topPlayerColor}
                timeRemaining={topPlayerColor === 'w' ? whiteTime : blackTime}
                captured={topPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                materialAdvantage={topPlayerColor === 'w' ? materialAdvantage : -materialAdvantage}
                isThinking={isAIThinking && currentTurn === topPlayerColor}
              />
            </div>

            {/* Floating Bottom Player HUD */}
            <div className="absolute bottom-16 sm:bottom-4 left-2 right-2 sm:right-auto sm:left-4 z-10 sm:w-72 pointer-events-auto">
              <PlayerHUD
                color={bottomPlayerColor}
                name={bottomPlayerName}
                isAI={bottomPlayerIsAI}
                aiDifficulty={bottomPlayerIsAI ? aiDifficulty : undefined}
                isTurn={currentTurn === bottomPlayerColor && !isGameOver}
                isCheck={chess.isCheck() && currentTurn === bottomPlayerColor}
                timeRemaining={bottomPlayerColor === 'w' ? whiteTime : blackTime}
                captured={bottomPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                materialAdvantage={bottomPlayerColor === 'w' ? materialAdvantage : -materialAdvantage}
                isThinking={isAIThinking && currentTurn === bottomPlayerColor}
              />
            </div>

            {/* Floating Camera Controls & Drawer HUD */}
            <div className="absolute bottom-2 left-2 right-2 sm:left-auto sm:bottom-4 sm:right-4 z-10 flex justify-center sm:justify-end">
              <ControlsHUD
                cameraView={cameraView}
                onChangeCameraView={setCameraView}
                onResetCamera={() => setCameraView(isPlayerBlack ? 'black' : 'white')}
                onToggleMoveHistory={() => setShowMoveHistory((prev) => !prev)}
                showMoveHistory={showMoveHistory}
              />
            </div>

            {/* Move History Drawer Overlay */}
            {showMoveHistory && (
              <div className="absolute top-16 sm:top-4 right-2 sm:right-4 z-20 pointer-events-auto animate-in slide-in-from-right duration-200">
                <MoveHistory
                  history={history}
                  currentFen={fen}
                  onClose={() => setShowMoveHistory(false)}
                />
              </div>
            )}

            {/* Active Turn Indicator Banner (Subtle floating center top) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800/80 bg-slate-950/75 backdrop-blur-md text-xs font-mono z-10 pointer-events-none">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentTurn === 'w' ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                } ${isAIThinking ? 'animate-ping' : ''}`}
              />
              <span className="text-slate-300">
                {isAIThinking
                  ? 'TEKNOVA AI ANALYZING…'
                  : `${currentTurn === 'w' ? 'WHITE' : 'BLACK'} TO MOVE`}
              </span>
            </div>
          </main>
        </>
      )}

      {/* Pawn Promotion Modal */}
      {promotionRequest && (
        <PromotionModal
          color={promotionRequest.color}
          onSelectPiece={handlePromotionSelect}
        />
      )}

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartGame={handleStartNewGame}
        currentMode={gameMode}
        currentDifficulty={aiDifficulty}
        currentPlayerColor={playerColor}
        currentTimeControl={timeControl}
      />

      {/* Game Over Victory / Draw Dialog */}
      {gameOverInfo && (
        <GameOverModal
          isOpen={true}
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          totalMoves={history.length}
          onRestart={handleRestartGame}
          onClose={() => setGameOverInfo(null)}
        />
      )}

      {/* Settings Modal (Global) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* How to Play & Rulebook Modal (Global) */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
