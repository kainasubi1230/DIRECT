'use client';

import React from 'react';
import { GameState, WallLength, WallOrientation, PlayerId } from '@/types/game';
import { Shield, RotateCw, XCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { canPlaceWall } from '@/lib/gameEngine';

interface WallStockPanelProps {
  state: GameState;
  onSelectWallLength: (len: WallLength | null) => void;
  onToggleOrientation: () => void;
  onConfirmPlaceWall: (wallData: { r: number; c: number; orientation: WallOrientation; length: WallLength }) => void;
  cursorGroove: { r: number; c: number };
  onChangeCursorGroove: (updater: (prev: { r: number; c: number }) => { r: number; c: number }) => void;
  isMyTurn: boolean;
  myPlayerId?: PlayerId;
}

export const WallStockPanel: React.FC<WallStockPanelProps> = ({
  state,
  onSelectWallLength,
  onToggleOrientation,
  onConfirmPlaceWall,
  cursorGroove,
  onChangeCursorGroove,
  isMyTurn,
  myPlayerId = 1,
}) => {
  const { currentTurn, players, walls, selectedWallLength, selectedWallOrientation, gameMode } = state;

  const activePlayer = players[currentTurn];
  const activeStock = activePlayer.stock;

  const isPlacingWall = selectedWallLength !== null;

  // Max bounds for D-Pad cursor based on wall orientation and length
  const maxR = selectedWallOrientation === 'H' ? 7 : (selectedWallLength ? 9 - selectedWallLength : 7);
  const maxC = selectedWallOrientation === 'H' ? (selectedWallLength ? 9 - selectedWallLength : 7) : 7;

  // Evaluate D-Pad position validity
  let dPadValidation: { valid: boolean; reason?: string } | null = null;
  if (isPlacingWall && selectedWallLength) {
    dPadValidation = canPlaceWall(
      {
        r: Math.min(cursorGroove.r, maxR),
        c: Math.min(cursorGroove.c, maxC),
        orientation: selectedWallOrientation,
        length: selectedWallLength,
        placedBy: currentTurn,
      },
      walls,
      players[1].pos,
      players[2].pos
    );
  }

  const colNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header with Player Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-200">
            壁ストック & コントローラー
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

      {/* Overview of both Players' Stocks */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {([1, 2] as PlayerId[]).map((pId) => {
          const p = players[pId];
          const isTurn = currentTurn === pId;
          const isMe = gameMode === 'ONLINE_P2P' ? myPlayerId === pId : true;

          return (
            <div
              key={pId}
              className={`p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                isTurn
                  ? 'bg-slate-950 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px]" style={{ color: p.color }}>
                  {p.name} {gameMode === 'ONLINE_P2P' && isMe ? '(あなた)' : ''}
                </span>
                {isTurn && (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                    TURN
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span>L1: <strong className="text-white">{p.stock.len1}</strong></span>
                <span>L2: <strong className="text-white">{p.stock.len2}</strong></span>
                <span>L3: <strong className="text-white">{p.stock.len3}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wall Length Selector Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3] as WallLength[]).map((len) => {
          const count = activeStock[`len${len}` as keyof typeof activeStock];
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

      {/* Smartphone D-Pad Wall Placement Controller */}
      {isPlacingWall && selectedWallLength && (
        <div className="flex flex-col gap-3 p-3 bg-slate-950/80 border border-amber-500/40 rounded-2xl animate-fadeIn shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">
              📱 矢印ボタンで位置移動 (最右列 I列 対応)
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              位置: {cursorGroove.r + 1}行-{colNames[Math.min(cursorGroove.c, maxC)]}列
            </span>
          </div>

          {/* D-Pad Buttons & Controls Grid */}
          <div className="flex items-center justify-around gap-2">
            <div className="relative w-28 h-28 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
              <div />
              <button
                onClick={() =>
                  onChangeCursorGroove((prev) => ({ ...prev, r: Math.max(0, prev.r - 1) }))
                }
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 rounded-xl flex items-center justify-center text-slate-200 shadow"
                title="上へ"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() =>
                  onChangeCursorGroove((prev) => ({ ...prev, c: Math.max(0, prev.c - 1) }))
                }
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 rounded-xl flex items-center justify-center text-slate-200 shadow"
                title="左へ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center text-[10px] font-bold text-slate-500 select-none">
                移動
              </div>

              <button
                onClick={() =>
                  onChangeCursorGroove((prev) => ({ ...prev, c: Math.min(maxC, prev.c + 1) }))
                }
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 rounded-xl flex items-center justify-center text-slate-200 shadow"
                title="右へ"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onClick={() =>
                  onChangeCursorGroove((prev) => ({ ...prev, r: Math.min(maxR, prev.r + 1) }))
                }
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 rounded-xl flex items-center justify-center text-slate-200 shadow"
                title="下へ"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            {/* Confirm Place Wall Button */}
            <div className="flex-1 flex flex-col gap-2">
              <button
                disabled={!dPadValidation?.valid}
                onClick={() => {
                  if (dPadValidation?.valid) {
                    onConfirmPlaceWall({
                      r: Math.min(cursorGroove.r, maxR),
                      c: Math.min(cursorGroove.c, maxC),
                      orientation: selectedWallOrientation,
                      length: selectedWallLength,
                    });
                  }
                }}
                className={`w-full py-3.5 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  dPadValidation?.valid
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 cursor-pointer'
                    : 'bg-slate-900 border border-rose-500/40 text-rose-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>
                  {dPadValidation?.valid
                    ? 'ここに壁を設置'
                    : dPadValidation?.reason || '設置不可'}
                </span>
              </button>

              <button
                onClick={() => onSelectWallLength(null)}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-800"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>壁選択をキャンセル</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
