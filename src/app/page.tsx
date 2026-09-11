'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  Position,
  WallLength,
  WallOrientation,
  GameMode,
  AIDifficulty,
  PlayerId
} from '@/types/game';
import {
  createInitialState,
  getValidMoves,
  executeMovePiece,
  executePlaceWall,
  executeActivateCard,
  executeRecallWall,
  cancelActiveCard
} from '@/lib/gameEngine';
import { computeBestAiAction } from '@/lib/aiEngine';
import { sounds } from '@/lib/audio';
import { peerManager } from '@/lib/multiplayerPeer';
import { firebaseMultiplayer } from '@/lib/firebaseMultiplayer';
import { Board } from '@/components/Board';
import { WallStockPanel } from '@/components/WallStockPanel';
import { CardPanel } from '@/components/CardPanel';
import { CardPlayBanner } from '@/components/CardPlayBanner';
import { GameHeader } from '@/components/GameHeader';
import { GameLog } from '@/components/GameLog';
import { OnlineRoomModal } from '@/components/OnlineRoomModal';
import { RuleModal } from '@/components/RuleModal';
import { VictoryModal } from '@/components/VictoryModal';
import { Wifi, RotateCw } from 'lucide-react';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState('LOCAL', 'MEDIUM'));
  const [isMuted, setIsMuted] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [flipBoard, setFlipBoard] = useState(false);
  const [cursorGroove, setCursorGroove] = useState<{ r: number; c: number }>({ r: 3, c: 3 });

  // Online Multiplayer State
  const [onlineStatus, setOnlineStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [onlineStatusMsg, setOnlineStatusMsg] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [myPlayerId, setMyPlayerId] = useState<PlayerId>(1);

  // Compute valid moves for current turn
  const validMoves = getValidMoves(gameState);

  const isMyTurnInMode = useCallback(() => {
    if (gameState.winner !== null) return false;
    if (gameState.gameMode === 'LOCAL') return true;
    if (gameState.gameMode === 'VS_AI') return gameState.currentTurn === 1;
    if (gameState.gameMode === 'ONLINE_P2P') return gameState.currentTurn === myPlayerId;
    return true;
  }, [gameState.winner, gameState.gameMode, gameState.currentTurn, myPlayerId]);

  // Sync online state helper (Dual Firebase + PeerJS Sync for 100% reliability)
  const syncStateOnline = (newState: GameState) => {
    const onlineState = { ...newState, gameMode: 'ONLINE_P2P' as const };
    setGameState(onlineState);
    if (gameState.gameMode === 'ONLINE_P2P' || onlineStatus === 'CONNECTED') {
      firebaseMultiplayer.syncGameState(onlineState);
      peerManager.sendStateSync(onlineState);
    }
  };

  // Auto-close Online Modal when connected
  useEffect(() => {
    if (onlineStatus === 'CONNECTED') {
      const timer = setTimeout(() => {
        setIsOnlineModalOpen(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onlineStatus]);

  // AI Turn Triggering Effect
  useEffect(() => {
    if (
      gameState.gameMode === 'VS_AI' &&
      gameState.currentTurn === 2 &&
      gameState.winner === null
    ) {
      setGameState((prev) => ({ ...prev, isAiThinking: true }));

      const timer = setTimeout(() => {
        setGameState((prev) => {
          const aiState = computeBestAiAction(prev);
          sounds.playMove();
          return { ...aiState, isAiThinking: false };
        });
      }, 750);

      return () => clearTimeout(timer);
    }
  }, [gameState.gameMode, gameState.currentTurn, gameState.winner, gameState.turnCount]);

  // Action Handler: Cell Click (Move Piece)
  const handleCellClick = (pos: Position) => {
    if (!isMyTurnInMode()) return;

    const nextState = executeMovePiece(gameState, pos);
    sounds.playMove();
    syncStateOnline(nextState);
  };

  // Action Handler: Wall Placement Click
  const handleWallClick = (wallData: { r: number; c: number; orientation: WallOrientation; length: WallLength }) => {
    if (!isMyTurnInMode()) return;

    const result = executePlaceWall(gameState, wallData);
    if (result.success) {
      sounds.playWallPlace();
      syncStateOnline(result.newState);
    } else {
      sounds.playError();
      alert(result.error || '壁を設置できませんでした');
    }
  };

  // Action Handler: Activate Action Card by cardId
  const handleActivateCard = (cardId: string) => {
    if (!isMyTurnInMode()) return;

    const result = executeActivateCard(gameState, cardId);
    if (result.success) {
      sounds.playCardPlay();
      syncStateOnline(result.newState);
    } else {
      sounds.playError();
      alert(result.error || 'カードを発動できませんでした');
    }
  };

  // Action Handler: Cancel Active Card
  const handleCancelCard = () => {
    const nextState = cancelActiveCard(gameState);
    syncStateOnline(nextState);
  };

  // Action Handler: Wall Recall Click
  const handleRecallWallClick = (wallId: string) => {
    if (!isMyTurnInMode()) return;

    const result = executeRecallWall(gameState, wallId);
    if (result.success) {
      sounds.playRecallWall();
      syncStateOnline(result.newState);
    } else {
      sounds.playError();
      alert(result.error || '壁を回収できませんでした');
    }
  };

  // Action Handler: Select Wall Length in Stock
  const handleSelectWallLength = (len: WallLength | null) => {
    setGameState((prev) => ({
      ...prev,
      selectedWallLength: len,
    }));
    if (len !== null) {
      setCursorGroove({ r: 3, c: 3 });
    }
  };

  // Action Handler: Toggle Wall Orientation
  const handleToggleOrientation = () => {
    setGameState((prev) => ({
      ...prev,
      selectedWallOrientation: prev.selectedWallOrientation === 'H' ? 'V' : 'H',
    }));
  };

  // Mode & Difficulty Selection
  const handleSelectGameMode = (mode: GameMode, difficulty: AIDifficulty = 'MEDIUM') => {
    const initialState = createInitialState(mode, difficulty);
    setGameState(initialState);
    if (mode === 'ONLINE_P2P') {
      setIsOnlineModalOpen(true);
    }
  };

  // Reset / Restart Game
  const handleResetGame = () => {
    const resetState = createInitialState(gameState.gameMode, gameState.aiDifficulty);
    syncStateOnline(resetState);
  };

  // Online Room Creation (Host) via Firebase + PeerJS
  const handleCreateRoom = (code: string) => {
    setRoomCode(code);
    setMyPlayerId(1);
    setFlipBoard(false);
    const initSt = createInitialState('ONLINE_P2P', gameState.aiDifficulty);
    setGameState(initSt);

    const onStateUpdate = (receivedState: GameState) => {
      setGameState({ ...receivedState, gameMode: 'ONLINE_P2P' });
    };

    const onStatusUpdate = (status: any, msg?: string) => {
      setOnlineStatus(status);
      if (msg) setOnlineStatusMsg(msg);
    };

    // Initialize Firebase Room Creation
    firebaseMultiplayer.createRoom(code, initSt, onStateUpdate, onStatusUpdate);

    // Initialize PeerJS P2P fallback
    peerManager.initHost(code, onStateUpdate, onStatusUpdate, () => {
      peerManager.sendStateSync(initSt);
    });
  };

  // Online Room Joining (Guest) via Firebase + PeerJS
  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    setMyPlayerId(2);
    setFlipBoard(true);
    const initSt = createInitialState('ONLINE_P2P', gameState.aiDifficulty);
    setGameState(initSt);

    const onStateUpdate = (receivedState: GameState) => {
      setGameState({ ...receivedState, gameMode: 'ONLINE_P2P' });
    };

    const onStatusUpdate = (status: any, msg?: string) => {
      setOnlineStatus(status);
      if (msg) setOnlineStatusMsg(msg);
    };

    // Initialize Firebase Room Joining
    firebaseMultiplayer.joinRoom(code, onStateUpdate, onStatusUpdate);

    // Initialize PeerJS P2P fallback
    peerManager.initGuest(code, onStateUpdate, onStatusUpdate);
  };

  // Toggle Sound Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setEnabled(!nextMuted);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* App Header */}
      <GameHeader
        state={gameState}
        onSelectGameMode={handleSelectGameMode}
        onResetGame={handleResetGame}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Online Match Role & Turn Banner */}
      {gameState.gameMode === 'ONLINE_P2P' && (
        <div className="w-full bg-slate-900/90 border-b border-cyan-500/30 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-xs shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Wifi className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>ROOM: {roomCode || '---'} (Firebase)</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span>あなたは</span>
            <span
              className="font-black px-2.5 py-0.5 rounded-full text-white shadow"
              style={{ backgroundColor: myPlayerId === 1 ? '#ef4444' : '#3b82f6' }}
            >
              P{myPlayerId} ({myPlayerId === 1 ? '赤 / ホスト' : '青 / ゲスト'})
            </span>
            <span>です</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="font-extrabold">
            {gameState.currentTurn === myPlayerId ? (
              <span className="text-emerald-400 animate-pulse">★ あなたのターンです！</span>
            ) : (
              <span className="text-slate-400">相手の思考・行動中...</span>
            )}
          </div>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setFlipBoard(!flipBoard)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-semibold transition-all"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>視点反転: {flipBoard ? 'ON (P2)' : 'OFF (P1)'}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Action Cards & Wall Stock + D-Pad Controller */}
        <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1">
          <WallStockPanel
            state={gameState}
            onSelectWallLength={handleSelectWallLength}
            onToggleOrientation={handleToggleOrientation}
            onConfirmPlaceWall={handleWallClick}
            cursorGroove={cursorGroove}
            onChangeCursorGroove={setCursorGroove}
            isMyTurn={isMyTurnInMode()}
            myPlayerId={myPlayerId}
          />
          <CardPanel
            state={gameState}
            onActivateCard={handleActivateCard}
            onCancelCard={handleCancelCard}
            isMyTurn={isMyTurnInMode()}
            myPlayerId={myPlayerId}
          />
        </div>

        {/* Center Column: Animated Card Banner & Interactive 9x9 Board */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2 w-full">
          <CardPlayBanner state={gameState} />
          <Board
            state={gameState}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            onWallClick={handleWallClick}
            onRecallWallClick={handleRecallWallClick}
            isMyTurn={isMyTurnInMode()}
            flipped={flipBoard}
            cursorGroove={gameState.selectedWallLength !== null ? cursorGroove : null}
            onCursorGrooveChange={setCursorGroove}
          />
        </div>

        {/* Right Column: Game Logs & Status Info */}
        <div className="lg:col-span-3 flex flex-col gap-5 order-3">
          <GameLog state={gameState} />

          {/* Quick Tips Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200">💡 プレイのヒント</h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>【壁2個設置】は1個目の壁を置いた時点でカードが消費（使用済）になります！</li>
              <li>Firebase リアルタイム通信により環境・通信制限を問わずオンライン対戦が可能です。</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modals */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        connectionStatus={onlineStatus}
        statusMessage={onlineStatusMsg}
        roomCode={roomCode}
      />

      <RuleModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <VictoryModal
        winner={gameState.winner}
        players={gameState.players}
        turnCount={gameState.turnCount}
        onRestart={handleResetGame}
      />
    </div>
  );
}
