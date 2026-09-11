'use client';

import React from 'react';
import { GameState, WallLength, WallOrientation, PlayerId } from '@/types/game';
import { Shield, RotateCw, XCircle } from 'lucide-react';

interface WallStockPanelProps {
  state: GameState;
  onSelectWallLength: (len: WallLength | null) => void;
  onToggleOrientation: () => void;
  isMyTurn: boolean;
}

export const WallStockPanel: React.FC<WallStockPanelProps> = ({
  state,
  onSelectWallLength,
  onToggleOrientation,
  isMyTurn,
}) => {
  const { currentTurn, players, selectedWallLength, selectedWallOrientation, actionPhase } = state;
  const activePlayer = players[currentTurn];
  const stock = activePlayer.stock;

  const isPlacingWall = selectedWallLength !== null;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-200">
            {activePlayer.name} の壁ストック
          </h3>
        </div>

        {/* Orientation Toggle Button */}
        <button
          onClick={onToggleOrientation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>向き: {selectedWallOrientation === 'H' ? '横 (Horizontal)' : '縦 (Vertical)'}</span>
        </button>
      </div>

      {/* Wall Length Selector Grid */}
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3] as WallLength[]).map((len) => {
          const count = stock[`len${len}` as keyof typeof stock];
          const isSelected = selectedWallLength === len;
          const isDisabled = !isMyTurn || count <= 0;

          return (
            <button
              key={len}
              disabled={isDisabled}
              onClick={() => onSelectWallLength(isSelected ? null : len)}
              className={`relative p-3 rounded-xl border flex flex-col items-center justify-between gap-1 transition-all duration-200 ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                  : isDisabled
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-300">長さ {len}</span>
              </div>

              {/* Visual representation of length */}
              <div className="flex items-center gap-0.5 my-1">
                {Array.from({ length: len }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-sm ${
                      selectedWallOrientation === 'H' ? 'w-4 h-2' : 'w-2 h-4'
                    } ${isSelected ? 'bg-amber-400' : 'bg-slate-400'}`}
                  />
                ))}
              </div>

              <div className="text-[11px] font-semibold text-amber-400">
                残り <span className="text-sm font-black">{count}</span> 枚
              </div>
            </button>
          );
        })}
      </div>

      {/* Placement active status message */}
      {isPlacingWall && (
        <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <span className="text-xs text-amber-300 font-medium">
            盤面の溝（グリッドの隙間）をクリックして壁を設置してください
          </span>
          <button
            onClick={() => onSelectWallLength(null)}
            className="text-slate-400 hover:text-white p-1"
            title="壁設置をキャンセル"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
