import {
  GameState,
  Position,
  WallLength,
  WallOrientation,
  CardType,
  WallStock
} from '@/types/game';
import {
  getPathDistanceToGoal,
  getValidNormalMoves,
  canPlaceWall,
  executeMovePiece,
  executePlaceWall,
  executeActivateCard,
  executeRecallWall,
  getValidJumpCardMoves,
  getValidDoubleMoveCardMoves
} from './gameEngine';

export function computeBestAiAction(state: GameState): GameState {
  if (state.winner !== null || state.currentTurn !== 2) return state;

  const difficulty = state.aiDifficulty;

  if (difficulty === 'EASY') {
    return computeEasyMove(state);
  } else if (difficulty === 'MEDIUM') {
    return computeMediumMove(state);
  } else {
    return computeHardMove(state);
  }
}

function computeEasyMove(state: GameState): GameState {
  const p2 = state.players[2];
  const p1 = state.players[1];

  // 70% chance to move forward, 30% chance to place a wall if available
  const hasWalls = p2.stock.len1 > 0 || p2.stock.len2 > 0 || p2.stock.len3 > 0;
  const shouldPlaceWall = hasWalls && Math.random() < 0.3;

  if (shouldPlaceWall) {
    const wallLengths: WallLength[] = [3, 2, 1];
    const availableLens = wallLengths.filter((l) => p2.stock[`len${l}` as keyof WallStock] > 0);
    const chosenLen = availableLens[Math.floor(Math.random() * availableLens.length)];
    const orientation: WallOrientation = Math.random() < 0.5 ? 'H' : 'V';

    // Try random positions near Player 1
    for (let r = Math.max(0, p1.pos.r - 2); r <= Math.min(7, p1.pos.r + 2); r++) {
      for (let c = Math.max(0, p1.pos.c - 2); c <= Math.min(7, p1.pos.c + 2); c++) {
        const result = executePlaceWall(state, { r, c, orientation, length: chosenLen });
        if (result.success) return result.newState;
      }
    }
  }

  // Otherwise, move towards goal
  const normalMoves = getValidNormalMoves(state);
  if (normalMoves.length === 0) return state;

  // Pick move that minimizes distance to goal (Row 8)
  let bestMove = normalMoves[0];
  let minDistance = 999;

  for (const m of normalMoves) {
    const dist = getPathDistanceToGoal({ r: m.r, c: m.c }, p2.goalRow, state.walls);
    if (dist !== -1 && dist < minDistance) {
      minDistance = dist;
      bestMove = m;
    }
  }

  return executeMovePiece(state, { r: bestMove.r, c: bestMove.c });
}

function computeMediumMove(state: GameState): GameState {
  const p1 = state.players[1];
  const p2 = state.players[2];

  const p1Dist = getPathDistanceToGoal(p1.pos, p1.goalRow, state.walls);
  const p2Dist = getPathDistanceToGoal(p2.pos, p2.goalRow, state.walls);

  // If AI has 2-Step Move card and dist to goal is close, use it!
  const doubleMoveCard = p2.cards.find((c) => c.type === 'DOUBLE_MOVE' && !c.used);
  if (doubleMoveCard && p2Dist <= 4) {
    const activated = executeActivateCard(state, 'DOUBLE_MOVE');
    if (activated.success) {
      const moves = getValidDoubleMoveCardMoves(activated.newState);
      let bestM = moves[0];
      let minDist = 999;
      for (const m of moves) {
        const d = getPathDistanceToGoal({ r: m.r, c: m.c }, p2.goalRow, state.walls);
        if (d !== -1 && d < minDist) {
          minDist = d;
          bestM = m;
        }
      }
      if (bestM) return executeMovePiece(activated.newState, { r: bestM.r, c: bestM.c });
    }
  }

  // If Player 1 is closer to winning than AI (p1Dist < p2Dist), try placing a wall to delay Player 1
  if (p1Dist < p2Dist) {
    const wallLengths: WallLength[] = [3, 2, 1];
    const availableLens = wallLengths.filter((l) => p2.stock[`len${l}` as keyof WallStock] > 0);

    let bestWall: { r: number; c: number; orientation: WallOrientation; length: WallLength } | null = null;
    let maxP1Delay = 0;

    for (const len of availableLens) {
      for (const orientation of ['H', 'V'] as WallOrientation[]) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const val = canPlaceWall({ r, c, orientation, length: len, placedBy: 2 }, state.walls, p1.pos, p2.pos);
            if (val.valid) {
              const testWalls = [...state.walls, { id: 'temp', r, c, orientation, length: len, placedBy: 2 as const }];
              const newP1Dist = getPathDistanceToGoal(p1.pos, p1.goalRow, testWalls);
              const newP2Dist = getPathDistanceToGoal(p2.pos, p2.goalRow, testWalls);

              const delay = newP1Dist - p1Dist - (newP2Dist - p2Dist);
              if (delay > maxP1Delay) {
                maxP1Delay = delay;
                bestWall = { r, c, orientation, length: len };
              }
            }
          }
        }
      }
    }

    if (bestWall && maxP1Delay >= 1) {
      const placed = executePlaceWall(state, bestWall);
      if (placed.success) return placed.newState;
    }
  }

  // Default: Move optimal 1 step towards goal
  const normalMoves = getValidNormalMoves(state);
  if (normalMoves.length > 0) {
    let bestMove = normalMoves[0];
    let minDistance = 999;

    for (const m of normalMoves) {
      const dist = getPathDistanceToGoal({ r: m.r, c: m.c }, p2.goalRow, state.walls);
      if (dist !== -1 && dist < minDistance) {
        minDistance = dist;
        bestMove = m;
      }
    }

    return executeMovePiece(state, { r: bestMove.r, c: bestMove.c });
  }

  return state;
}

function computeHardMove(state: GameState): GameState {
  // Advanced Minimax-style Heuristic Evaluation
  const p1 = state.players[1];
  const p2 = state.players[2];

  const p1Dist = getPathDistanceToGoal(p1.pos, p1.goalRow, state.walls);
  const p2Dist = getPathDistanceToGoal(p2.pos, p2.goalRow, state.walls);

  let bestState: GameState = state;
  let maxScore = -99999;

  // 1. Evaluate Jump Card
  const jumpCard = p2.cards.find((c) => c.type === 'JUMP' && !c.used);
  if (jumpCard) {
    const act = executeActivateCard(state, 'JUMP');
    if (act.success) {
      const jumps = getValidJumpCardMoves(act.newState);
      for (const j of jumps) {
        const d = getPathDistanceToGoal({ r: j.r, c: j.c }, p2.goalRow, state.walls);
        const score = (p1Dist - d) * 20;
        if (score > maxScore) {
          maxScore = score;
          bestState = executeMovePiece(act.newState, { r: j.r, c: j.c });
        }
      }
    }
  }

  // 2. Evaluate Double Move Card
  const dMoveCard = p2.cards.find((c) => c.type === 'DOUBLE_MOVE' && !c.used);
  if (dMoveCard) {
    const act = executeActivateCard(state, 'DOUBLE_MOVE');
    if (act.success) {
      const dMoves = getValidDoubleMoveCardMoves(act.newState);
      for (const m of dMoves) {
        const d = getPathDistanceToGoal({ r: m.r, c: m.c }, p2.goalRow, state.walls);
        const score = (p1Dist - d) * 15;
        if (score > maxScore) {
          maxScore = score;
          bestState = executeMovePiece(act.newState, { r: m.r, c: m.c });
        }
      }
    }
  }

  // 3. Evaluate Wall placements
  const wallLengths: WallLength[] = [3, 2, 1];
  const availableLens = wallLengths.filter((l) => p2.stock[`len${l}` as keyof WallStock] > 0);

  for (const len of availableLens) {
    for (const orientation of ['H', 'V'] as WallOrientation[]) {
      for (let r = Math.max(0, p1.pos.r - 2); r <= Math.min(7, p1.pos.r + 2); r++) {
        for (let c = Math.max(0, p1.pos.c - 2); c <= Math.min(7, p1.pos.c + 2); c++) {
          const val = canPlaceWall({ r, c, orientation, length: len, placedBy: 2 }, state.walls, p1.pos, p2.pos);
          if (val.valid) {
            const testWalls = [...state.walls, { id: 'temp', r, c, orientation, length: len, placedBy: 2 as const }];
            const newP1Dist = getPathDistanceToGoal(p1.pos, p1.goalRow, testWalls);
            const newP2Dist = getPathDistanceToGoal(p2.pos, p2.goalRow, testWalls);

            const score = (newP1Dist - p1Dist) * 25 - (newP2Dist - p2Dist) * 15;
            if (score > maxScore) {
              const placed = executePlaceWall(state, { r, c, orientation, length: len });
              if (placed.success) {
                maxScore = score;
                bestState = placed.newState;
              }
            }
          }
        }
      }
    }
  }

  // 4. Evaluate Normal Move
  const normalMoves = getValidNormalMoves(state);
  for (const m of normalMoves) {
    const d = getPathDistanceToGoal({ r: m.r, c: m.c }, p2.goalRow, state.walls);
    const score = (p1Dist - d) * 10;
    if (score > maxScore) {
      maxScore = score;
      bestState = executeMovePiece(state, { r: m.r, c: m.c });
    }
  }

  return bestState;
}
