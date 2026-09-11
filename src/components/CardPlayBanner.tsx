'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { Zap, CornerDownRight, Layers, Undo2, Sparkles } from 'lucide-react';

interface CardPlayBannerProps {
  state: GameState;
}

export const CardPlayBanner: React.FC<CardPlayBannerProps> = ({ state }) => {
  const { currentTurn, players, activeCardEffect, actionPhase } = state;
  const activePlayer = players[currentTurn];

  if (activeCardEffect === 'NONE') return null;

  const getCardInfo = () => {
    switch (activeCardEffect) {
      case 'JUMP':
        return {
          title: '【ジャンプ】発動中！',
          desc: '隣接する壁を1つ飛び越えるマスを選択してください',
          icon: <Zap className="w-5 h-5 text-purple-300" />,
          color: 'from-purple-900/90 via-purple-600/90 to-indigo-900/90 border-purple-400 text-purple-100',
        };
      case 'DOUBLE_MOVE':
        return {
          title: '【2マス移動】発動中！',
          desc: '壁を越えずに合計2マス移動するルートを選択してください',
          icon: <CornerDownRight className="w-5 h-5 text-cyan-300" />,
          color: 'from-cyan-900/90 via-blue-600/90 to-sky-900/90 border-cyan-400 text-cyan-100',
        };
      case 'DOUBLE_WALL':
        return {
          title: '【壁2個設置】発動中！',
          desc: actionPhase === 'DOUBLE_WALL_SECOND' ? '2枚目の壁を設置してください' : '1枚目の壁を設置してください',
          icon: <Layers className="w-5 h-5 text-emerald-300" />,
          color: 'from-emerald-900/90 via-teal-600/90 to-green-900/90 border-emerald-400 text-emerald-100',
        };
      case 'RECALL_WALL':
        return {
          title: '【壁回収】発動中！',
          desc: '盤面上の回収したい壁をクリックしてください',
          icon: <Undo2 className="w-5 h-5 text-rose-300" />,
          color: 'from-rose-900/90 via-red-600/90 to-pink-900/90 border-rose-400 text-rose-100',
        };
      default:
        return null;
    }
  };

  const info = getCardInfo();
  if (!info) return null;

  return (
    <div className="w-full max-w-lg mx-auto mb-3 animate-fadeIn">
      <div className={`p-3.5 rounded-2xl border bg-gradient-to-r ${info.color} shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-md flex items-center justify-between gap-3 animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black/40 rounded-xl border border-white/20">
            {info.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activePlayer.color }}
              />
              <span className="font-extrabold text-xs">{activePlayer.name}</span>
              <span className="font-black text-sm">{info.title}</span>
            </div>
            <p className="text-xs text-white/80 font-medium mt-0.5">{info.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-xl border border-amber-400/30 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>カード発動中</span>
        </div>
      </div>
    </div>
  );
};
