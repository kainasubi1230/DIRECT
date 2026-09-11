export type PlayerId = 1 | 2; // 1 = Red/Bottom (starts at 8,4), 2 = Blue/Top (starts at 0,4)

export interface Position {
  r: number; // 0 to 8
  c: number; // 0 to 8
}

export type WallOrientation = 'H' | 'V'; // Horizontal or Vertical
export type WallLength = 1 | 2 | 3;

export interface Wall {
  id: string;
  r: number; // Groove start row (0 to 7)
  c: number; // Groove start col (0 to 7)
  orientation: WallOrientation;
  length: WallLength;
  placedBy: PlayerId;
}

export interface WallStock {
  len1: number; // default: 3
  len2: number; // default: 4
  len3: number; // default: 3
}

export type CardType = 'JUMP' | 'DOUBLE_MOVE' | 'DOUBLE_WALL' | 'RECALL_WALL';

export interface CardState {
  id: string;
  type: CardType;
  used: boolean;
  name: string;
  count: number;
  description: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  pos: Position;
  goalRow: number; // Player 1 goal: 0, Player 2 goal: 8
  stock: WallStock;
  cards: CardState[];
  color: string;
}

export type ActionPhase = 
  | 'SELECT_ACTION'     // Normal turn option: Move, Place Wall, or Play Card
  | 'DOUBLE_WALL_SECOND' // Placed 1 wall, now placing 2nd wall for DOUBLE_WALL card
  | 'RECALL_WALL_SELECT'; // Selecting an existing wall to recall for RECALL_WALL card

export type ActiveCardEffect = 'NONE' | 'JUMP' | 'DOUBLE_MOVE' | 'DOUBLE_WALL' | 'RECALL_WALL';

export type GameMode = 'LOCAL' | 'VS_AI' | 'ONLINE_P2P';
export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface MoveLogItem {
  id: string;
  turn: number;
  player: PlayerId;
  description: string;
  timestamp: string;
}

export interface GameState {
  boardSize: number; // 9
  players: Record<PlayerId, PlayerState>;
  currentTurn: PlayerId;
  walls: Wall[];
  turnCount: number;
  winner: PlayerId | null;
  activeCardEffect: ActiveCardEffect;
  actionPhase: ActionPhase;
  selectedWallLength: WallLength | null;
  selectedWallOrientation: WallOrientation;
  moveHistory: MoveLogItem[];
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  isAiThinking: boolean;
}

export interface MoveCandidate {
  r: number;
  c: number;
  type: 'NORMAL' | 'JUMP_CARD' | 'DOUBLE_MOVE_CARD';
  path?: Position[];
}
