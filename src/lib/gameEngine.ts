import {
  GameState,
  PlayerId,
  Position,
  Wall,
  WallLength,
  WallOrientation,
  MoveCandidate,
  CardType,
  PlayerState,
  WallStock,
  ActiveCardEffect
} from '@/types/game';

export const BOARD_SIZE = 9;

export function createInitialState(gameMode: GameState['gameMode'] = 'LOCAL', difficulty: GameState['aiDifficulty'] = 'MEDIUM'): GameState {
  const player1: PlayerState = {
    id: 1,
    name: 'プレイヤー 1',
    pos: { r: 8, c: 4 },
    goalRow: 0,
    stock: { len1: 3, len2: 4, len3: 3 },
    cards: [
      { id: 'p1_jump', type: 'JUMP', used: false, name: '【ジャンプ】', count: 1, description: '隣接する壁を1つ飛び越えて向こう側に移動する' },
      { id: 'p1_double_move', type: 'DOUBLE_MOVE', used: false, name: '【2マス移動】', count: 1, description: '壁を越えずに合計2マス移動する（L字可）' },
      { id: 'p1_double_wall', type: 'DOUBLE_WALL', used: false, name: '【壁2個設置】', count: 1, description: '自分のストックから壁を2個連続で設置する' },
      { id: 'p1_recall_1', type: 'RECALL_WALL', used: false, name: '【壁回収】', count: 2, description: '盤面の壁を1個取り除き、自分のストックに回収する' },
    ],
    color: '#ef4444', // Red / Crimson
  };

  const player2: PlayerState = {
    id: 2,
    name: gameMode === 'VS_AI' ? 'AI コンピュータ' : 'プレイヤー 2',
    pos: { r: 0, c: 4 },
    goalRow: 8,
    stock: { len1: 3, len2: 4, len3: 3 },
    cards: [
      { id: 'p2_jump', type: 'JUMP', used: false, name: '【ジャンプ】', count: 1, description: '隣接する壁を1つ飛び越えて向こう側に移動する' },
      { id: 'p2_double_move', type: 'DOUBLE_MOVE', used: false, name: '【2マス移動】', count: 1, description: '壁を越えずに合計2マス移動する（L字可）' },
      { id: 'p2_double_wall', type: 'DOUBLE_WALL', used: false, name: '【壁2個設置】', count: 1, description: '自分のストックから壁を2個連続で設置する' },
      { id: 'p2_recall_1', type: 'RECALL_WALL', used: false, name: '【壁回収】', count: 2, description: '盤面の壁を1個取り除き、自分のストックに回収する' },
    ],
    color: '#3b82f6', // Electric Blue / Cyan
  };

  return {
    boardSize: BOARD_SIZE,
    players: { 1: player1, 2: player2 },
    currentTurn: 1,
    walls: [],
    turnCount: 1,
    winner: null,
    activeCardEffect: 'NONE',
    actionPhase: 'SELECT_ACTION',
    selectedWallLength: null,
    selectedWallOrientation: 'H',
    moveHistory: [],
    gameMode,
    aiDifficulty: difficulty,
    isAiThinking: false,
  };
}

/**
 * Checks if moving directly between adjacent cells (r1, c1) and (r2, c2) is blocked by any wall.
 */
export function isBlockedByWall(r1: number, c1: number, r2: number, c2: number, walls: Wall[]): boolean {
  if (r1 < 0 || r1 >= BOARD_SIZE || c1 < 0 || c1 >= BOARD_SIZE) return true;
  if (r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) return true;

  // Ensure (r1,c1) and (r2,c2) are adjacent
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return true;

  for (const w of walls) {
    if (w.orientation === 'H') {
      // Horizontal wall between row w.r and w.r + 1, covering cols w.c ... w.c + w.length - 1
      const isBetweenRows = (r1 === w.r && r2 === w.r + 1) || (r1 === w.r + 1 && r2 === w.r);
      if (isBetweenRows) {
        const colCovered = c1 >= w.c && c1 < w.c + w.length;
        if (colCovered) return true;
      }
    } else {
      // Vertical wall between col w.c and w.c + 1, covering rows w.r ... w.r + w.length - 1
      const isBetweenCols = (c1 === w.c && c2 === w.c + 1) || (c1 === w.c + 1 && c2 === w.c);
      if (isBetweenCols) {
        const rowCovered = r1 >= w.r && r1 < w.r + w.length;
        if (rowCovered) return true;
      }
    }
  }

  return false;
}

/**
 * BFS algorithm to verify if player has at least one valid path to their goal row.
 * Returns shortest path distance, or -1 if unreachable.
 */
export function getPathDistanceToGoal(start: Position, goalRow: number, walls: Wall[]): number {
  if (start.r === goalRow) return 0;

  const queue: Array<{ pos: Position; dist: number }> = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${start.r},${start.c}`);

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { r, c } = current.pos;

    if (r === goalRow) {
      return current.dist;
    }

    for (const dir of directions) {
      const nr = r + dir.dr;
      const nc = c + dir.dc;

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && !isBlockedByWall(r, c, nr, nc, walls)) {
          visited.add(key);
          queue.push({ pos: { r: nr, c: nc }, dist: current.dist + 1 });
        }
      }
    }
  }

  return -1; // Unreachable
}

export function hasPathToGoal(start: Position, goalRow: number, walls: Wall[]): boolean {
  return getPathDistanceToGoal(start, goalRow, walls) !== -1;
}

/**
 * Validates whether a wall can be placed on the board according to grid boundaries,
 * collision with existing walls, and absolute path blockage rules.
 */
export function canPlaceWall(
  candidate: Omit<Wall, 'id'>,
  currentWalls: Wall[],
  p1Pos: Position,
  p2Pos: Position
): { valid: boolean; reason?: string } {
  const { r, c, orientation, length } = candidate;

  // 1. Boundary check
  if (r < 0 || c < 0) return { valid: false, reason: '盤面外の位置です' };
  if (orientation === 'H') {
    if (r >= BOARD_SIZE - 1) return { valid: false, reason: '横壁を置く行が盤面外です' };
    if (c + length > BOARD_SIZE) return { valid: false, reason: '壁が盤面の右端を超えています' };
  } else {
    if (c >= BOARD_SIZE - 1) return { valid: false, reason: '縦壁を置く列が盤面外です' };
    if (r + length > BOARD_SIZE) return { valid: false, reason: '壁が盤面の下端を超えています' };
  }

  // Helper to extract segments covered by candidate
  const candidateSegments: Array<{ type: 'H' | 'V'; r: number; c: number }> = [];
  for (let i = 0; i < length; i++) {
    if (orientation === 'H') {
      candidateSegments.push({ type: 'H', r, c: c + i });
    } else {
      candidateSegments.push({ type: 'V', r: r + i, c });
    }
  }

  // 2. Collision check with existing walls
  for (const wall of currentWalls) {
    for (let i = 0; i < wall.length; i++) {
      const existingSeg = {
        type: wall.orientation,
        r: wall.orientation === 'H' ? wall.r : wall.r + i,
        c: wall.orientation === 'H' ? wall.c + i : wall.c,
      };

      for (const candSeg of candidateSegments) {
        // Direct segment overlap (same orientation, same segment)
        if (candSeg.type === existingSeg.type && candSeg.r === existingSeg.r && candSeg.c === existingSeg.c) {
          return { valid: false, reason: '他の壁と重なっています' };
        }

        // Crossing check (Perpendicular walls intersecting at the exact midpoint edge segment)
        // e.g. Horizontal wall at (r, c) crossing Vertical wall at (r, c)
        if (candSeg.type === 'H' && existingSeg.type === 'V') {
          if (candSeg.r === existingSeg.r && candSeg.c === existingSeg.c) {
            return { valid: false, reason: '他の壁と交差しています' };
          }
        }
        if (candSeg.type === 'V' && existingSeg.type === 'H') {
          if (candSeg.r === existingSeg.r && candSeg.c === existingSeg.c) {
            return { valid: false, reason: '他の壁と交差しています' };
          }
        }
      }
    }
  }

  // 3. Absolute Rule check: BOTH players must still have a valid path to their goal row!
  const testWalls = [...currentWalls, { ...candidate, id: 'test', placedBy: candidate.placedBy }];
  
  const p1HasPath = hasPathToGoal(p1Pos, 0, testWalls);
  if (!p1HasPath) {
    return { valid: false, reason: '【完全封鎖の禁止】プレイヤー1のゴールへの経路が塞がれます' };
  }

  const p2HasPath = hasPathToGoal(p2Pos, 8, testWalls);
  if (!p2HasPath) {
    return { valid: false, reason: '【完全封鎖の禁止】プレイヤー2のゴールへの経路が塞がれます' };
  }

  return { valid: true };
}

/**
 * Calculates valid normal moves for the active player.
 */
export function getValidNormalMoves(state: GameState): MoveCandidate[] {
  const currentP = state.players[state.currentTurn];
  const opponentP = state.players[state.currentTurn === 1 ? 2 : 1];
  const moves: MoveCandidate[] = [];

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  for (const dir of directions) {
    const nr = currentP.pos.r + dir.dr;
    const nc = currentP.pos.c + dir.dc;

    // Check boundary and wall between current pos and (nr, nc)
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      if (!isBlockedByWall(currentP.pos.r, currentP.pos.c, nr, nc, state.walls)) {
        // Is opponent on (nr, nc)?
        if (nr === opponentP.pos.r && nc === opponentP.pos.c) {
          // Pawn Jump Rule!
          const jumpR = nr + dir.dr;
          const jumpC = nc + dir.dc;

          // Straight jump over opponent
          const canJumpStraight =
            jumpR >= 0 &&
            jumpR < BOARD_SIZE &&
            jumpC >= 0 &&
            jumpC < BOARD_SIZE &&
            !isBlockedByWall(nr, nc, jumpR, jumpC, state.walls);

          if (canJumpStraight) {
            moves.push({ r: jumpR, c: jumpC, type: 'NORMAL' });
          } else {
            // Diagonal jump options if straight jump is blocked by wall or board edge
            const diagDirs = dir.dr !== 0 ? [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }] : [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }];
            for (const dDir of diagDirs) {
              const diagR = nr + dDir.dr;
              const diagC = nc + dDir.dc;
              if (
                diagR >= 0 &&
                diagR < BOARD_SIZE &&
                diagC >= 0 &&
                diagC < BOARD_SIZE &&
                !isBlockedByWall(nr, nc, diagR, diagC, state.walls)
              ) {
                moves.push({ r: diagR, c: diagC, type: 'NORMAL' });
              }
            }
          }
        } else {
          // Normal 1-step move
          moves.push({ r: nr, c: nc, type: 'NORMAL' });
        }
      }
    }
  }

  return moves;
}

/**
 * Calculates valid moves when the 【ジャンプ】 (Jump) card is active.
 * Jump Card effect: Jump over 1 adjacent wall in any 4 direction to the cell immediately behind it.
 */
export function getValidJumpCardMoves(state: GameState): MoveCandidate[] {
  const currentP = state.players[state.currentTurn];
  const opponentP = state.players[state.currentTurn === 1 ? 2 : 1];
  const moves: MoveCandidate[] = [];

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  for (const dir of directions) {
    const targetR = currentP.pos.r + dir.dr;
    const targetC = currentP.pos.c + dir.dc;

    // Check if target is inside board
    if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
      // Must be a wall between current position and target cell!
      const wallPresent = isBlockedByWall(currentP.pos.r, currentP.pos.c, targetR, targetC, state.walls);

      if (wallPresent) {
        // Target cell must not contain opponent piece
        const isOccupied = targetR === opponentP.pos.r && targetC === opponentP.pos.c;
        if (!isOccupied) {
          moves.push({ r: targetR, c: targetC, type: 'JUMP_CARD' });
        }
      }
    }
  }

  return moves;
}

/**
 * Calculates valid moves when the 【2マス移動】 (2-Step Move) card is active.
 * Moves total 2 cells without crossing walls. Can change direction (L-shape).
 */
export function getValidDoubleMoveCardMoves(state: GameState): MoveCandidate[] {
  const currentP = state.players[state.currentTurn];
  const opponentP = state.players[state.currentTurn === 1 ? 2 : 1];
  const candidateMap = new Map<string, MoveCandidate>();

  // Helper to explore 2 steps from current position
  // Step 1:
  const firstStepMoves = getValidNormalMoves(state);

  for (const m1 of firstStepMoves) {
    // Temp state after step 1
    const tempState: GameState = {
      ...state,
      players: {
        ...state.players,
        [state.currentTurn]: {
          ...currentP,
          pos: { r: m1.r, c: m1.c },
        },
      },
    };

    const secondStepMoves = getValidNormalMoves(tempState);
    for (const m2 of secondStepMoves) {
      // Must not end up back at original position unless no choice (usually unique 2-step cell)
      if (m2.r !== currentP.pos.r || m2.c !== currentP.pos.c) {
        const key = `${m2.r},${m2.c}`;
        if (!candidateMap.has(key)) {
          candidateMap.set(key, { r: m2.r, c: m2.c, type: 'DOUBLE_MOVE_CARD' });
        }
      }
    }
  }

  return Array.from(candidateMap.values());
}

/**
 * Returns all valid moves for the current active card effect or normal turn.
 */
export function getValidMoves(state: GameState): MoveCandidate[] {
  if (state.winner !== null) return [];

  if (state.activeCardEffect === 'JUMP') {
    return getValidJumpCardMoves(state);
  }
  if (state.activeCardEffect === 'DOUBLE_MOVE') {
    return getValidDoubleMoveCardMoves(state);
  }
  if (state.actionPhase === 'SELECT_ACTION') {
    return getValidNormalMoves(state);
  }

  return [];
}

/**
 * Executes a piece move for current player.
 */
export function executeMovePiece(state: GameState, targetPos: Position): GameState {
  const pId = state.currentTurn;
  const player = state.players[pId];
  const opponentId = pId === 1 ? 2 : 1;
  const isWinner = targetPos.r === player.goalRow;

  const logDesc = `${player.name} が (${targetPos.r + 1}, ${targetPos.c + 1}) に移動しました`;

  let nextActiveCardEffect: ActiveCardEffect = 'NONE';
  let nextActionPhase: GameState['actionPhase'] = 'SELECT_ACTION';

  // If card was played (e.g. Jump or Double Move), reset active card effect
  const updatedCards = player.cards.map((c) => {
    if (state.activeCardEffect === 'JUMP' && c.type === 'JUMP' && !c.used) {
      return { ...c, used: true };
    }
    if (state.activeCardEffect === 'DOUBLE_MOVE' && c.type === 'DOUBLE_MOVE' && !c.used) {
      return { ...c, used: true };
    }
    return c;
  });

  return {
    ...state,
    players: {
      ...state.players,
      [pId]: {
        ...player,
        pos: targetPos,
        cards: updatedCards,
      },
    },
    winner: isWinner ? pId : null,
    currentTurn: isWinner ? pId : opponentId,
    turnCount: state.turnCount + 1,
    activeCardEffect: nextActiveCardEffect,
    actionPhase: nextActionPhase,
    selectedWallLength: null,
    moveHistory: [
      {
        id: `move_${Date.now()}_${Math.random()}`,
        turn: state.turnCount,
        player: pId,
        description: logDesc,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...state.moveHistory,
    ],
  };
}

/**
 * Executes wall placement.
 */
export function executePlaceWall(
  state: GameState,
  wallData: { r: number; c: number; orientation: WallOrientation; length: WallLength }
): { newState: GameState; success: boolean; error?: string } {
  const pId = state.currentTurn;
  const player = state.players[pId];
  const opponentId = pId === 1 ? 2 : 1;

  // Check stock availability
  const lenKey = `len${wallData.length}` as keyof WallStock;
  if (player.stock[lenKey] <= 0) {
    return { newState: state, success: false, error: `長さ ${wallData.length} の壁がストックにありません` };
  }

  // Validate placement logic & path constraint
  const validation = canPlaceWall(
    { ...wallData, placedBy: pId },
    state.walls,
    state.players[1].pos,
    state.players[2].pos
  );

  if (!validation.valid) {
    return { newState: state, success: false, error: validation.reason };
  }

  const newWall: Wall = {
    id: `wall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...wallData,
    placedBy: pId,
  };

  const newStock = {
    ...player.stock,
    [lenKey]: player.stock[lenKey] - 1,
  };

  const logDesc = `${player.name} が長さ ${wallData.length} の壁 (${wallData.orientation === 'H' ? '横' : '縦'}) を設置しました`;

  let nextPhase: GameState['actionPhase'] = 'SELECT_ACTION';
  let nextTurn: PlayerId = opponentId;
  let nextActiveCard: ActiveCardEffect = 'NONE';
  let updatedCards = [...player.cards];

  // Handle DOUBLE_WALL card logic
  if (state.activeCardEffect === 'DOUBLE_WALL' && state.actionPhase === 'SELECT_ACTION') {
    // Placed 1st wall, check if 2nd wall can be placed
    const totalRemaining = newStock.len1 + newStock.len2 + newStock.len3;
    if (totalRemaining > 0) {
      nextPhase = 'DOUBLE_WALL_SECOND';
      nextTurn = pId; // Still player's turn for 2nd wall!
      nextActiveCard = 'DOUBLE_WALL';
    } else {
      // No remaining walls in stock, mark card used and end turn
      updatedCards = player.cards.map((c) => (c.type === 'DOUBLE_WALL' ? { ...c, used: true } : c));
    }
  } else if (state.activeCardEffect === 'DOUBLE_WALL' && state.actionPhase === 'DOUBLE_WALL_SECOND') {
    // Placed 2nd wall, mark card used and end turn
    updatedCards = player.cards.map((c) => (c.type === 'DOUBLE_WALL' ? { ...c, used: true } : c));
  }

  const newState: GameState = {
    ...state,
    walls: [...state.walls, newWall],
    players: {
      ...state.players,
      [pId]: {
        ...player,
        stock: newStock,
        cards: updatedCards,
      },
    },
    currentTurn: nextTurn,
    turnCount: nextTurn !== pId ? state.turnCount + 1 : state.turnCount,
    actionPhase: nextPhase,
    activeCardEffect: nextActiveCard,
    selectedWallLength: null,
    moveHistory: [
      {
        id: `move_${Date.now()}_${Math.random()}`,
        turn: state.turnCount,
        player: pId,
        description: logDesc,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...state.moveHistory,
    ],
  };

  return { newState, success: true };
}

/**
 * Activates an Action Card for the active player.
 */
export function executeActivateCard(state: GameState, cardType: CardType): { newState: GameState; success: boolean; error?: string } {
  const pId = state.currentTurn;
  const player = state.players[pId];
  const card = player.cards.find((c) => c.type === cardType && !c.used);

  if (!card) {
    return { newState: state, success: false, error: 'このカードは所持していないか使用済みです' };
  }

  let nextActiveCard: ActiveCardEffect = 'NONE';
  let nextPhase: GameState['actionPhase'] = 'SELECT_ACTION';

  if (cardType === 'JUMP') {
    const validJumps = getValidJumpCardMoves({ ...state, activeCardEffect: 'JUMP' });
    if (validJumps.length === 0) {
      return { newState: state, success: false, error: '飛び越えられる壁が周囲にありません' };
    }
    nextActiveCard = 'JUMP';
  } else if (cardType === 'DOUBLE_MOVE') {
    const validMoves = getValidDoubleMoveCardMoves({ ...state, activeCardEffect: 'DOUBLE_MOVE' });
    if (validMoves.length === 0) {
      return { newState: state, success: false, error: '2マス移動できるルートがありません' };
    }
    nextActiveCard = 'DOUBLE_MOVE';
  } else if (cardType === 'DOUBLE_WALL') {
    const totalWalls = player.stock.len1 + player.stock.len2 + player.stock.len3;
    if (totalWalls <= 0) {
      return { newState: state, success: false, error: 'ストックに設置できる壁がありません' };
    }
    nextActiveCard = 'DOUBLE_WALL';
  } else if (cardType === 'RECALL_WALL') {
    if (state.walls.length === 0) {
      return { newState: state, success: false, error: '盤面に回収できる壁がありません' };
    }
    nextActiveCard = 'RECALL_WALL';
    nextPhase = 'RECALL_WALL_SELECT';
  }

  const logDesc = `${player.name} がカード ${card.name} を発動しました`;

  const newState: GameState = {
    ...state,
    activeCardEffect: nextActiveCard,
    actionPhase: nextPhase,
    moveHistory: [
      {
        id: `move_${Date.now()}_${Math.random()}`,
        turn: state.turnCount,
        player: pId,
        description: logDesc,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...state.moveHistory,
    ],
  };

  return { newState, success: true };
}

/**
 * Executes wall recall for RECALL_WALL card.
 */
export function executeRecallWall(state: GameState, wallId: string): { newState: GameState; success: boolean; error?: string } {
  const pId = state.currentTurn;
  const player = state.players[pId];
  const opponentId = pId === 1 ? 2 : 1;

  const targetWall = state.walls.find((w) => w.id === wallId);
  if (!targetWall) {
    return { newState: state, success: false, error: '対象の壁が見つかりません' };
  }

  const lenKey = `len${targetWall.length}` as keyof WallStock;
  const newStock = {
    ...player.stock,
    [lenKey]: player.stock[lenKey] + 1,
  };

  const updatedCards = player.cards.map((c) => {
    if (c.type === 'RECALL_WALL' && !c.used) {
      // Mark 1 instance of RECALL_WALL as used
      return { ...c, used: true };
    }
    return c;
  });

  const logDesc = `${player.name} が盤面から長さ ${targetWall.length} の壁を回収し、ストックに加えました`;

  const newState: GameState = {
    ...state,
    walls: state.walls.filter((w) => w.id !== wallId),
    players: {
      ...state.players,
      [pId]: {
        ...player,
        stock: newStock,
        cards: updatedCards,
      },
    },
    currentTurn: opponentId,
    turnCount: state.turnCount + 1,
    activeCardEffect: 'NONE',
    actionPhase: 'SELECT_ACTION',
    selectedWallLength: null,
    moveHistory: [
      {
        id: `move_${Date.now()}_${Math.random()}`,
        turn: state.turnCount,
        player: pId,
        description: logDesc,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...state.moveHistory,
    ],
  };

  return { newState, success: true };
}

/**
 * Cancels active card selection and reverts phase to normal turn selection.
 */
export function cancelActiveCard(state: GameState): GameState {
  return {
    ...state,
    activeCardEffect: 'NONE',
    actionPhase: 'SELECT_ACTION',
    selectedWallLength: null,
  };
}
