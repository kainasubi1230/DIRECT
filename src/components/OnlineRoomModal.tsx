'use client';

import React, { useState } from 'react';
import { Globe, Copy, Check, X, Users, Play } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-slate-100">オンライン対戦 (P2P)</h2>
            <p className="text-xs text-slate-400">WebRTCによる直接リアルタイム通信</p>
          </div>
        </div>

        {/* Status Alert Banner */}
        {connectionStatus !== 'DISCONNECTED' && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : connectionStatus === 'CONNECTING'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{statusMessage || connectionStatus}</span>
          </div>
        )}

        {/* Create Room Section */}
        <div className="flex flex-col gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-200">1. ルームを作成する (ホスト)</h3>
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
          <h3 className="font-bold text-sm text-slate-200">2. ルームに参加する (ゲスト)</h3>
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
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              参加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
