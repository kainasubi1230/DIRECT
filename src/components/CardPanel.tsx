'use client';

import React, { useState } from 'react';
import { GameState, CardType, PlayerId } from '@/types/game';
import { Zap, CornerDownRight, Layers, Undo2, CheckCircle2, Eye } from 'lucide-react';

interface CardPanelProps {
  state: GameState;
  onActivateCard: (cardId: string) => void;
  onCancelCard: () => void;
  isMyTurn: boolean;
  myPlayerId?: PlayerId;
}

export const CardPanel: React.FC<CardPanelProps> = ({
  state,
  onActivateCard,
  onCancelCard,
  isMyTurn,
  myPlayerId = 1,
}) => {
  const { currentTurn, players, activeCardEffect, gameMode } = state;
  const [selectedPlayerTab, setSelectedPlayerTab] = useState<PlayerId>(
    gameMode === 'ONLINE_P2P' ? myPlayerId : currentTurn
  );

  const activePlayer = players[currentTurn];
  const viewedPlayer = players[selectedPlayerTab];

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
            アクションカード (手札: 公開情報)
          </h3>
        </div>
        {activeCardEffect !== 'NONE' && (
          <button
            onClick={onCancelCard}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs text-rose-300 font-semibold transition-all animate-pulse"
          >
            カード選択解除
          </button>
        )}
      </div>

      {/* Player Tabs: Switch between Player 1 & Player 2 hands */}
      <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
        {([1, 2] as PlayerId[]).map((pId) => {
          const p = players[pId];
          const isSelected = selectedPlayerTab === pId;
          const isTurn = currentTurn === pId;
          const isMe = gameMode === 'ONLINE_P2P' ? myPlayerId === pId : true;

          return (
            <button
              key={pId}
              onClick={() => setSelectedPlayerTab(pId)}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-slate-800 text-white border border-slate-700 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name} {gameMode === 'ONLINE_P2P' ? (isMe ? '(あなた)' : '(相手)') : ''}</span>
              {isTurn && (
                <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded">
                  TURN
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Viewed Player Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {viewedPlayer.cards.map((card) => {
          const isCurrentPlayerTurn = currentTurn === selectedPlayerTab;
          const isActive = isCurrentPlayerTurn && activeCardEffect === card.type && !card.used;
          const isInteractive = isMyTurn && isCurrentPlayerTurn && !card.used;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (isInteractive) {
                  if (isActive) {
                    onCancelCard();
                  } else {
                    onActivateCard(card.id);
                  }
                }
              }}
              className={`relative p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all duration-200 ${
                isActive
                  ? 'bg-purple-950/60 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02] cursor-pointer ring-2 ring-purple-400'
                  : card.used
                  ? 'bg-slate-950/60 border-slate-900/80 opacity-40 grayscale cursor-not-allowed'
                  : !isInteractive
                  ? 'bg-slate-900/60 border-slate-800 opacity-80 cursor-default'
                  : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-purple-500/50 cursor-pointer hover:scale-[1.01]'
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
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    未使用
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                {card.description}
              </p>

              {isActive && (
                <div className="text-[10px] font-bold text-purple-300 animate-pulse flex items-center gap-1">
                  ● カード発動中: 対象またはマスを選択
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
