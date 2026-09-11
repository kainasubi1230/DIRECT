'use client';

import React from 'react';
import { GameState, CardType, PlayerId } from '@/types/game';
import { Zap, CornerDownRight, Layers, Undo2, CheckCircle2 } from 'lucide-react';

interface CardPanelProps {
  state: GameState;
  onActivateCard: (type: CardType) => void;
  onCancelCard: () => void;
  isMyTurn: boolean;
}

export const CardPanel: React.FC<CardPanelProps> = ({
  state,
  onActivateCard,
  onCancelCard,
  isMyTurn,
}) => {
  const { currentTurn, players, activeCardEffect, actionPhase } = state;
  const activePlayer = players[currentTurn];

  const getIcon = (type: CardType) => {
    switch (type) {
      case 'JUMP':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'DOUBLE_MOVE':
        return <CornerDownRight className="w-4 h-4 text-cyan-400" />;
      case 'DOUBLE_WALL':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'RECALL_WALL':
        return <Undo2 className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-sm text-slate-200">
            {activePlayer.name} のアクションカード (公開情報)
          </h3>
        </div>
        {activeCardEffect !== 'NONE' && (
          <button
            onClick={onCancelCard}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs text-rose-300 font-semibold transition-all"
          >
            カード選択解除
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activePlayer.cards.map((card) => {
          const isActive = activeCardEffect === card.type;
          const isDisabled = !isMyTurn || card.used || (activeCardEffect !== 'NONE' && !isActive);

          return (
            <div
              key={card.id}
              onClick={() => {
                if (!isDisabled) {
                  if (isActive) {
                    onCancelCard();
                  } else {
                    onActivateCard(card.type);
                  }
                }
              }}
              className={`relative p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all duration-200 ${
                isActive
                  ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02] cursor-pointer'
                  : card.used
                  ? 'bg-slate-950/60 border-slate-900/80 opacity-40 grayscale cursor-not-allowed'
                  : !isMyTurn
                  ? 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
                  : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-purple-500/50 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(card.type)}
                  <span className="font-bold text-xs text-slate-100">{card.name}</span>
                </div>
                {card.used ? (
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-slate-600" /> 使用済
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded-full border border-purple-500/30">
                    x{card.count}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                {card.description}
              </p>

              {isActive && (
                <div className="text-[10px] font-bold text-purple-300 animate-pulse">
                  ● カード発動中: アクションを選択してください
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
