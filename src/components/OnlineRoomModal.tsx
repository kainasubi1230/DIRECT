'use client';

import React, { useState } from 'react';
import { Globe, Copy, Check, X, Users, Play, Sparkles, ArrowRight } from 'lucide-react';

interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomCode: string) => void;
  onJoinRoom: (roomCode: string) => void;
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  statusMessage?: string;
  roomCode?: string;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  connectionStatus,
  statusMessage,
  roomCode: currentRoomCode,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = () => {
    const newCode = generateRoomCode();
    onCreateRoom(newCode);
  };

  const handleJoin = () => {
    if (inputCode.trim().length >= 4) {
      onJoinRoom(inputCode.trim().toUpperCase());
    }
  };

  const copyRoomCode = () => {
    if (currentRoomCode) {
      navigator.clipboard.writeText(currentRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-100">オンライン対戦 (Firebase / P2P)</h2>
            <p className="text-xs text-slate-400">リアルタイム同期対戦ルーム</p>
          </div>
        </div>

        {/* Status Alert Banner */}
        {connectionStatus !== 'DISCONNECTED' && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : connectionStatus === 'CONNECTING'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {connectionStatus === 'CONNECTED' && <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />}
              <span>{statusMessage || connectionStatus}</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1 shadow"
            >
              <span>対戦画面へ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Create Room Section */}
        <div className="flex flex-col gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200">1. ルームを作成する (ホスト / P1)</h3>
          {currentRoomCode ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400">あなたのルームコード:</span>
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-cyan-500/40 rounded-xl">
                <span className="font-mono font-black text-2xl tracking-widest text-cyan-300">
                  {currentRoomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'コピー完了' : 'コードをコピー'}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCreate}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              新しい対戦ルームを作成
            </button>
          )}
        </div>

        {/* Join Room Section */}
        <div className="flex flex-col gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200">2. ルームに参加する (ゲスト / P2)</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ルームコードを入力"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-100 font-mono text-sm uppercase outline-none"
            />
            <button
              onClick={handleJoin}
              disabled={inputCode.trim().length < 4}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              <Play className="w-4 h-4" />
              参加
            </button>
          </div>
        </div>

        {/* Manual Enter Game Button */}
        {(currentRoomCode || connectionStatus !== 'DISCONNECTED') && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-2xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>対戦画面へ移動する</span>
          </button>
        )}
      </div>
    </div>
  );
};
