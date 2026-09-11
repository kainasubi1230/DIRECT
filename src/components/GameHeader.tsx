'use client';

import React from 'react';
import { GameState, GameMode, AIDifficulty } from '@/types/game';
import { Volume2, VolumeX, RotateCcw, BookOpen, Users, Cpu, Globe } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface GameHeaderProps {
  state: GameState;
  onSelectGameMode: (mode: GameMode, difficulty?: AIDifficulty) => void;
  onResetGame: () => void;
  onOpenRules: () => void;
  onOpenOnlineModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  state,
  onSelectGameMode,
  onResetGame,
  onOpenRules,
  onOpenOnlineModal,
  isMuted,
  onToggleMute,
}) => {
  const { currentTurn, players, turnCount, winner, gameMode, aiDifficulty, isAiThinking } = state;
  const activePlayer = players[currentTurn];

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
      {/* Title Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]">
          D
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-200 to-cyan-400">
            DIRECT
          </h1>
          <p className="text-[10px] font-semibold text-slate-400">
            完全情報型 戦略ボードゲーム
          </p>
        </div>
      </div>

      {/* Mode Switcher & Status */}
      <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => onSelectGameMode('LOCAL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            gameMode === 'LOCAL'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>2P ローカル</span>
        </button>

        <button
          onClick={() => onSelectGameMode('VS_AI', aiDifficulty)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            gameMode === 'VS_AI'
              ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>VS AI ({aiDifficulty})</span>
        </button>

        <button
          onClick={onOpenOnlineModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            gameMode === 'ONLINE_P2P'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>オンライン</span>
        </button>
      </div>

      {/* Turn & Player Status */}
      <div className="flex items-center gap-4">
        {winner === null ? (
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-ping"
                style={{ backgroundColor: activePlayer.color }}
              />
              <span className="text-xs font-bold text-slate-200">
                Turn {turnCount}: <span style={{ color: activePlayer.color }}>{activePlayer.name}</span>
              </span>
            </div>
            {isAiThinking && (
              <span className="text-[11px] font-semibold text-purple-400 animate-pulse">
                (思考中...)
              </span>
            )}
          </div>
        ) : (
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold animate-bounce">
            🎉 {players[winner].name} の勝利！
          </div>
        )}

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'ミュート解除' : 'ミュート'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="ルール説明"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onResetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="リセット"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
