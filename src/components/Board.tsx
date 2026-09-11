'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  GameState,
  Position,
  WallLength,
  WallOrientation,
  MoveCandidate
} from '@/types/game';
import { BOARD_SIZE, canPlaceWall } from '@/lib/gameEngine';

interface BoardProps {
  state: GameState;
  validMoves: MoveCandidate[];
  onCellClick: (pos: Position) => void;
  onWallClick: (wallData: { r: number; c: number; orientation: WallOrientation; length: WallLength }) => void;
  onRecallWallClick: (wallId: string) => void;
  isMyTurn: boolean;
  flipped?: boolean;
  cursorGroove?: { r: number; c: number } | null;
  onCursorGrooveChange?: (groove: { r: number; c: number }) => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  validMoves,
  onCellClick,
  onWallClick,
  onRecallWallClick,
  isMyTurn,
  flipped = false,
  cursorGroove = null,
  onCursorGrooveChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const [localHoverGroove, setLocalHoverGroove] = useState<{
    r: number;
    c: number;
  } | null>(null);

  const {
    players,
    walls,
    currentTurn,
    selectedWallLength,
    selectedWallOrientation,
    actionPhase,
  } = state;

  const isPlacingWallMode =
    isMyTurn &&
    selectedWallLength !== null &&
    (actionPhase === 'SELECT_ACTION' || actionPhase === 'DOUBLE_WALL_SECOND');

  const isRecallWallMode = isMyTurn && actionPhase === 'RECALL_WALL_SELECT';

  // Responsive Auto-Scaling for Mobile & Various Screens
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - 16;
        const baseWidth = 584;
        if (availableWidth < baseWidth) {
          setScale(Math.max(0.48, availableWidth / baseWidth));
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Active groove for wall placement preview (cursorGroove from D-Pad or mouse hover)
  const activeGroove = isPlacingWallMode ? cursorGroove || localHoverGroove : null;

  // Helper to check if a cell position matches valid move candidates
  const getMoveTypeAt = (r: number, c: number) => {
    if (!isMyTurn) return null;
    const found = validMoves.find((m) => m.r === r && m.c === c);
    return found ? found.type : null;
  };

  // Helper to evaluate hover wall validity
  let hoverValidation: { valid: boolean; reason?: string } | null = null;
  if (activeGroove && isPlacingWallMode && selectedWallLength) {
    hoverValidation = canPlaceWall(
      {
        r: activeGroove.r,
        c: activeGroove.c,
        orientation: selectedWallOrientation,
        length: selectedWallLength,
        placedBy: currentTurn,
      },
      walls,
      players[1].pos,
      players[2].pos
    );
  }

  // Render groove hover previews
  const renderHoverWall = () => {
    if (!activeGroove || !isPlacingWallMode || !selectedWallLength || !hoverValidation) return null;

    const { r, c } = activeGroove;
    const isH = selectedWallOrientation === 'H';
    const isValid = hoverValidation.valid;

    const cellStep = 64; // 52px cell + 12px gap
    const wallThickness = 10;

    let left = 0;
    let top = 0;
    let width = 0;
    let height = 0;

    if (isH) {
      left = c * cellStep + 8;
      top = r * cellStep + 50;
      width = selectedWallLength * cellStep - 12;
      height = wallThickness;
    } else {
      left = c * cellStep + 50;
      top = r * cellStep + 8;
      width = wallThickness;
      height = selectedWallLength * cellStep - 12;
    }

    return (
      <div
        className={`absolute pointer-events-none z-30 transition-all duration-150 rounded-full flex items-center justify-center border-2 animate-pulse ${
          isValid
            ? 'bg-emerald-500/70 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)]'
            : 'bg-rose-500/70 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.9)]'
        }`}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          transform: flipped ? 'rotate(180deg)' : 'none',
        }}
      >
        <span className="text-[10px] font-extrabold text-white px-1 select-none drop-shadow whitespace-nowrap">
          {isValid ? `長さ ${selectedWallLength}` : hoverValidation.reason}
        </span>
      </div>
    );
  };

  // Render placed walls
  const renderPlacedWalls = () => {
    const cellStep = 64;
    const wallThickness = 12;

    return walls.map((w) => {
      const isH = w.orientation === 'H';
      const isPlayer1 = w.placedBy === 1;

      let left = 0;
      let top = 0;
      let width = 0;
      let height = 0;

      if (isH) {
        left = w.c * cellStep + 8;
        top = w.r * cellStep + 50;
        width = w.length * cellStep - 12;
        height = wallThickness;
      } else {
        left = w.c * cellStep + 50;
        top = w.r * cellStep + 8;
        width = wallThickness;
        height = w.length * cellStep - 12;
      }

      const isSelectableRecall = isRecallWallMode;

      return (
        <div
          key={w.id}
          onClick={() => {
            if (isRecallWallMode) {
              onRecallWallClick(w.id);
            }
          }}
          className={`absolute z-20 rounded-md transition-all duration-200 shadow-md ${
            isPlayer1
              ? 'bg-gradient-to-r from-rose-600 to-red-500 border border-rose-400/50 shadow-[0_0_8px_rgba(225,29,72,0.4)]'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
          } ${
            isSelectableRecall
              ? 'cursor-pointer hover:scale-105 hover:ring-4 hover:ring-amber-400 animate-pulse'
              : ''
          }`}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-[9px] font-black text-white/90 drop-shadow select-none"
              style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
            >
              L{w.length}
            </span>
          </div>
        </div>
      );
    });
  };

  const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center overflow-hidden touch-manipulation">
      <div
        style={{
          transform: `scale(${scale}) ${flipped ? 'rotate(180deg)' : ''}`,
          transformOrigin: 'top center',
          marginBottom: `${(scale - 1) * 584}px`,
        }}
        className="flex flex-col items-center select-none transition-transform duration-150"
      >
        {/* Top Column Labels */}
        <div className="flex pl-8 mb-1">
          {colLabels.map((lbl, idx) => (
            <div
              key={idx}
              className="w-[64px] text-center text-xs font-semibold text-slate-400"
              style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
            >
              {lbl}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Left Row Labels */}
          <div className="flex flex-col pr-2 justify-around">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={num}
                className="h-[64px] flex items-center text-xs font-semibold text-slate-400"
                style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Board Main Frame */}
          <div className="relative p-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            {/* Goal Line Indicators */}
            <div className="absolute top-1 left-2 right-2 h-1.5 bg-gradient-to-r from-rose-500/20 via-rose-500/80 to-rose-500/20 rounded-full animate-pulse flex items-center justify-center">
              <span
                className="text-[9px] text-rose-300/80 font-bold uppercase tracking-widest -mt-4"
                style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
              >
                P1 Goal (Row 1)
              </span>
            </div>
            <div className="absolute bottom-1 left-2 right-2 h-1.5 bg-gradient-to-r from-cyan-500/20 via-cyan-500/80 to-cyan-500/20 rounded-full animate-pulse flex items-center justify-center">
              <span
                className="text-[9px] text-cyan-300/80 font-bold uppercase tracking-widest -mb-4"
                style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
              >
                P2 Goal (Row 9)
              </span>
            </div>

            {/* Placed Walls */}
            {renderPlacedWalls()}

            {/* Wall Hover / D-Pad Preview */}
            {renderHoverWall()}

            {/* Grid Cells */}
            <div className="grid grid-cols-9 gap-[12px]">
              {Array.from({ length: BOARD_SIZE }).map((_, r) =>
                Array.from({ length: BOARD_SIZE }).map((_, c) => {
                  const moveType = getMoveTypeAt(r, c);
                  const isP1 = players[1].pos.r === r && players[1].pos.c === c;
                  const isP2 = players[2].pos.r === r && players[2].pos.c === c;

                  const isH = selectedWallOrientation === 'H';

                  // Correct validation check for horizontal vs vertical groove triggers
                  const isHGrooveValid = isPlacingWallMode && isH && r < 8 && selectedWallLength !== null && c + selectedWallLength <= 9;
                  const isVGrooveValid = isPlacingWallMode && !isH && c < 8 && selectedWallLength !== null && r + selectedWallLength <= 9;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => {
                        if (moveType) {
                          onCellClick({ r, c });
                        }
                      }}
                      className={`relative w-[52px] h-[52px] rounded-xl flex items-center justify-center transition-all duration-200 ${
                        r === 0
                          ? 'bg-rose-950/20 border-b border-rose-500/30'
                          : r === 8
                          ? 'bg-cyan-950/20 border-t border-cyan-500/30'
                          : 'bg-slate-900/90 border border-slate-800/80'
                      } ${
                        moveType
                          ? 'cursor-pointer scale-105 border-emerald-400 bg-emerald-950/30 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-110'
                          : ''
                      }`}
                    >
                      {/* Horizontal Groove Trigger (Below Cell) */}
                      {isHGrooveValid && (
                        <div
                          onMouseEnter={() => {
                            setLocalHoverGroove({ r, c });
                            onCursorGrooveChange?.({ r, c });
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedWallLength) {
                              onWallClick({
                                r,
                                c,
                                orientation: 'H',
                                length: selectedWallLength,
                              });
                            }
                          }}
                          className="absolute -bottom-[12px] left-0 w-full h-[24px] z-40 cursor-pointer rounded-md hover:bg-amber-400/40"
                        />
                      )}

                      {/* Vertical Groove Trigger (Right of Cell) */}
                      {isVGrooveValid && (
                        <div
                          onMouseEnter={() => {
                            setLocalHoverGroove({ r, c });
                            onCursorGrooveChange?.({ r, c });
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedWallLength) {
                              onWallClick({
                                r,
                                c,
                                orientation: 'V',
                                length: selectedWallLength,
                              });
                            }
                          }}
                          className="absolute -right-[12px] top-0 w-[24px] h-full z-40 cursor-pointer rounded-md hover:bg-amber-400/40"
                        />
                      )}

                      {/* Move Indicator Dot/Ring */}
                      {moveType === 'NORMAL' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-400/80 animate-ping" />
                      )}
                      {moveType === 'JUMP_CARD' && (
                        <div
                          className="w-6 h-6 rounded-full bg-purple-500/90 border-2 border-purple-300 animate-pulse flex items-center justify-center"
                          style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
                        >
                          <span className="text-[10px] font-bold text-white">J</span>
                        </div>
                      )}
                      {moveType === 'DOUBLE_MOVE_CARD' && (
                        <div
                          className="w-6 h-6 rounded-full bg-cyan-400/90 border-2 border-cyan-200 animate-pulse flex items-center justify-center"
                          style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}
                        >
                          <span className="text-[10px] font-bold text-black">2x</span>
                        </div>
                      )}

                      {/* Player 1 Token (Red) */}
                      {isP1 && (
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-700 via-red-500 to-rose-400 border-2 border-white/80 shadow-[0_0_20px_rgba(239,68,68,0.8)] flex items-center justify-center transform transition-transform duration-300">
                          <div className="w-4 h-4 rounded-full bg-white/90 shadow-inner" />
                          {currentTurn === 1 && (
                            <div className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping opacity-75 pointer-events-none" />
                          )}
                        </div>
                      )}

                      {/* Player 2 Token (Blue) */}
                      {isP2 && (
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-500 to-sky-300 border-2 border-white/80 shadow-[0_0_20px_rgba(59,130,246,0.8)] flex items-center justify-center transform transition-transform duration-300">
                          <div className="w-4 h-4 rounded-full bg-white/90 shadow-inner" />
                          {currentTurn === 2 && (
                            <div className="absolute -inset-1 rounded-full border-2 border-cyan-400 animate-ping opacity-75 pointer-events-none" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
