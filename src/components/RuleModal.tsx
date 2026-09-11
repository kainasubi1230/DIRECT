'use client';

import React, { useState } from 'react';
import { BookOpen, X, Shield, Zap, Target, AlertTriangle } from 'lucide-react';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'CARDS' | 'RULES'>('OVERVIEW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-100">ゲーム説明書：『DIRECT』</h2>
            <p className="text-xs text-slate-400">運要素ゼロ・完全情報型 戦略ボードゲーム</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('OVERVIEW')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'OVERVIEW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            概要・勝利条件
          </button>
          <button
            onClick={() => setTab('CARDS')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'CARDS' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            アクションカード
          </button>
          <button
            onClick={() => setTab('RULES')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'RULES' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            絶対ルール (封鎖禁止)
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed flex flex-col gap-4">
          {tab === 'OVERVIEW' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> 勝利条件
                </h4>
                <p>
                  自分のコマを、対岸の最奥列（相手のスタート地点側のライン）のいずれかのマスに先に到達させたプレイヤーの勝利！
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> ターンの行動 (以下のいずれか1つを実行)
                </h4>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-300">
                  <li><strong className="text-white">移動</strong>: 自分のコマを上下左右の隣接するマスに1歩動かす。</li>
                  <li><strong className="text-white">壁の設置</strong>: 自分のストックから長さ1, 2, 3の壁を1枚選び、盤面の溝に設置する。</li>
                  <li><strong className="text-white">カードの発動</strong>: 所持しているアクションカードを1枚使用し、効果を処理する。</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="font-bold text-emerald-300 mb-1">壁ストック仕様</h4>
                <p>各プレイヤーは合計10枚（20マス分）の壁を所持してスタートします。</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                  <li>1マス分の壁 × 3枚</li>
                  <li>2マス分の壁 × 4枚</li>
                  <li>3マス分の壁 × 3枚</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'CARDS' && (
            <div className="flex flex-col gap-3">
              <p className="text-slate-400">各プレイヤーはゲーム開始時、5枚のカードを表向き（公開情報）で所持します。</p>
              
              <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl">
                <h4 className="font-bold text-purple-300 mb-1">【ジャンプ】(1枚)</h4>
                <p>自分の上下左右に隣接している「壁」を1つ飛び越えて、すぐ向こう側のマスに移動する（壁の長さは問わない）。</p>
                <p className="text-purple-400/80 text-[11px] mt-1">※着地先に相手コマがいる、または盤面外に出る場合は使用不可。</p>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl">
                <h4 className="font-bold text-cyan-300 mb-1">【2マス移動】(1枚)</h4>
                <p>壁を越えずに、前後左右に合計2マス移動する。途中で方向を変える（L字に動く）ことも可能。</p>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl">
                <h4 className="font-bold text-emerald-300 mb-1">【壁2個設置】(1枚)</h4>
                <p>自分のストックにある壁を2枚選び、同一ターン内で連続設置する。</p>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl">
                <h4 className="font-bold text-rose-300 mb-1">【壁回収】(2枚)</h4>
                <p>現在盤面に設置されている壁を1枚取り除き、自分のストックに加える。相手が設置した壁も回収可能！</p>
              </div>
            </div>
          )}

          {tab === 'RULES' && (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl flex flex-col gap-2">
                <h4 className="font-extrabold text-rose-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  ※ 絶対ルール（完全封鎖の禁止）
                </h4>
                <p className="text-slate-200">
                  いかなる場合でも、「相手または自分のコマがゴール（対岸）へ到達する経路を完全になくす」ような壁の置き方は禁止されます。
                </p>
                <p className="text-slate-400 text-[11px]">
                  通常の壁設置、およびカード効果による壁設置の双方に適用され、システムが自動的にBFS経路探索判定を行います。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
