'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { History } from 'lucide-react';

interface GameLogProps {
  state: GameState;
}

export const GameLog: React.FC<GameLogProps> = ({ state }) => {
  const { moveHistory, players } = state;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3 max-h-[260px]">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-400" />
        <h3 className="font-bold text-xs text-slate-200">対局ログ</h3>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 text-xs">
        {moveHistory.length === 0 ? (
          <p className="text-slate-500 italic text-[11px]">対局の履歴がここに表示されます...</p>
        ) : (
          moveHistory.map((item) => {
            const playerColor = players[item.player]?.color || '#cbd5e1';
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: playerColor }}
                  />
                  <span className="font-semibold text-slate-300">{item.description}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
