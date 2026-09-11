'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  Position,
  WallLength,
  WallOrientation,
  CardType,
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
import { Board } from '@/components/Board';
import { WallStockPanel } from '@/components/WallStockPanel';
import { CardPanel } from '@/components/CardPanel';
import { GameHeader } from '@/components/GameHeader';
import { GameLog } from '@/components/GameLog';
import { OnlineRoomModal } from '@/components/OnlineRoomModal';
import { RuleModal } from '@/components/RuleModal';
import { VictoryModal } from '@/components/VictoryModal';
import { Globe, Users, Wifi } from 'lucide-react';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState('LOCAL', 'MEDIUM'));
  const [isMuted, setIsMuted] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);

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

  // Sync online state helper
  const syncStateOnline = (newState: GameState) => {
    setGameState(newState);
    if (gameState.gameMode === 'ONLINE_P2P') {
      peerManager.sendStateSync(newState);
    }
  };

  // Auto-close Online Modal when connected & Host sync state
  useEffect(() => {
    if (onlineStatus === 'CONNECTED') {
      const timer = setTimeout(() => {
        setIsOnlineModalOpen(false);
      }, 1200);

      // If host, send current initial state to guest
      if (myPlayerId === 1) {
        peerManager.sendStateSync(gameState);
      }

      return () => clearTimeout(timer);
    }
  }, [onlineStatus, myPlayerId, gameState]);

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

  // Action Handler: Activate Action Card
  const handleActivateCard = (type: CardType) => {
    if (!isMyTurnInMode()) return;

    const result = executeActivateCard(gameState, type);
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

  // Online Room Creation (Host)
  const handleCreateRoom = (code: string) => {
    setRoomCode(code);
    setMyPlayerId(1); // Host is Player 1 (Red)
    peerManager.initHost(
      code,
      (receivedState) => setGameState(receivedState),
      (status, msg) => {
        setOnlineStatus(status);
        if (msg) setOnlineStatusMsg(msg);
      }
    );
  };

  // Online Room Joining (Guest)
  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    setMyPlayerId(2); // Guest is Player 2 (Blue)
    peerManager.initGuest(
      code,
      (receivedState) => setGameState(receivedState),
      (status, msg) => {
        setOnlineStatus(status);
        if (msg) setOnlineStatusMsg(msg);
      }
    );
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
        <div className="w-full bg-slate-900/90 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-center gap-3 text-xs shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Wifi className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>ROOM: {roomCode || '---'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span>あなたは</span>
            <span
              className="font-black px-2 py-0.5 rounded-full text-white"
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
              <span className="text-slate-400">相手のターンです...</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Action Cards & Wall Stock */}
        <div className="lg:col-span-4 flex flex-col gap-5 order-2 lg:order-1">
          <WallStockPanel
            state={gameState}
            onSelectWallLength={handleSelectWallLength}
            onToggleOrientation={handleToggleOrientation}
            isMyTurn={isMyTurnInMode()}
          />
          <CardPanel
            state={gameState}
            onActivateCard={handleActivateCard}
            onCancelCard={handleCancelCard}
            isMyTurn={isMyTurnInMode()}
          />
        </div>

        {/* Center Column: Interactive 9x9 Board */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2 w-full">
          <Board
            state={gameState}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            onWallClick={handleWallClick}
            onRecallWallClick={handleRecallWallClick}
            isMyTurn={isMyTurnInMode()}
          />
        </div>

        {/* Right Column: Game Logs & Status Info */}
        <div className="lg:col-span-3 flex flex-col gap-5 order-3">
          <GameLog state={gameState} />

          {/* Quick Tips Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200">💡 プレイのヒント</h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>壁は長さ 1, 2, 3 の3種があります。</li>
              <li>相手または自分のパスを<span className="text-rose-400 font-bold">完全に塞ぐ配置は禁止</span>です。</li>
              <li>カードは各自5枚所持し、すべて公開情報です。相手の手札も意識して戦いましょう！</li>
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
