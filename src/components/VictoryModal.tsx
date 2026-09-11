'use client';

import React, { useEffect } from 'react';
import { GameState, PlayerId } from '@/types/game';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface VictoryModalProps {
  winner: PlayerId | null;
  players: GameState['players'];
  turnCount: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  players,
  turnCount,
  onRestart,
}) => {
  useEffect(() => {
    if (winner !== null) {
      sounds.playWinFanfare();
      // Launch Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [winner]);

  if (winner === null) return null;

  const winningPlayer = players[winner];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col items-center text-center gap-6 animate-scaleUp">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-yellow-400">
            VICTORY!
          </h2>
          <p className="text-lg font-bold mt-1" style={{ color: winningPlayer.color }}>
            {winningPlayer.name} の勝利！
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            {turnCount} ターンで対岸に到達しました
          </p>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          もう一度遊ぶ (再戦)
        </button>
      </div>
    </div>
  );
};
