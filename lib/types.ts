// ─── Directions ───────────────────────────────────────────────────────────────

export type Facing = "up" | "right" | "down" | "left";

export const FACING_DELTA: Record<Facing, { dc: number; dr: number }> = {
  up:    { dc:  0, dr: -1 },
  right: { dc:  1, dr:  0 },
  down:  { dc:  0, dr:  1 },
  left:  { dc: -1, dr:  0 },
};

export const TURN_LEFT: Record<Facing, Facing> = {
  up: "left", left: "down", down: "right", right: "up",
};
export const TURN_RIGHT: Record<Facing, Facing> = {
  up: "right", right: "down", down: "left", left: "up",
};

// ─── Paint colors ─────────────────────────────────────────────────────────────

export type PaintColor = "amber" | "purple" | "teal";

export const PAINT_HEX: Record<PaintColor, string> = {
  amber:  "#f2b640",
  purple: "#8b7cf0",
  teal:   "#2fd9c5",
};

// ─── Commands ─────────────────────────────────────────────────────────────────

export type CommandType =
  | "forward"
  | "turnLeft"
  | "turnRight"
  | "paint"
  | "loop"
  | "callProc";

export interface ForwardCmd   { type: "forward" }
export interface TurnLeftCmd  { type: "turnLeft" }
export interface TurnRightCmd { type: "turnRight" }

export interface PaintCmd {
  type: "paint";
  color: PaintColor;    // which color to fill the current cell
}

export interface LoopCmd {
  type: "loop";
  count: number;        // 2–10
  body: Command[];
}

export interface CallProcCmd {
  type: "callProc";
  procId: ProcId;
}

export type Command =
  | ForwardCmd
  | TurnLeftCmd
  | TurnRightCmd
  | PaintCmd
  | LoopCmd
  | CallProcCmd;

export type ProcId = "purple" | "teal" | "amber";

export type Procedures = Record<ProcId, Command[]>;

// ─── Level ────────────────────────────────────────────────────────────────────

export interface GridSize {
  cols: number;
  rows: number;
}

export interface StartPos {
  col: number;
  row: number;
  facing: Facing;
}

export type Cell = [number, number];  // [col, row]  (geometry only)

/** A cell in the target shape that must be painted with a specific color. */
export interface TargetCell {
  col: number;
  row: number;
  color: PaintColor;
}

export interface Level {
  id: number;
  title: string;
  goalText: string;
  gridSize: GridSize;
  start: StartPos;
  targetCells: TargetCell[];
  allowedBlocks: CommandType[];
  blockBudget: number | null;
  concept: string;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export interface BotState {
  col: number;
  row: number;
  facing: Facing;
}

/** A cell that has been painted, including the color that was used. */
export interface PaintedCell {
  col: number;
  row: number;
  color: PaintColor;
}

export interface StepFrame {
  bot: BotState;
  paintedCells: PaintedCell[];   // cumulative set at this step
  action: CommandType | "none";
  error?: string;
}

export interface RunResult {
  frames: StepFrame[];
  paintedCells: PaintedCell[];
  success: boolean;
  error?: string;
}

// ─── Session / API ────────────────────────────────────────────────────────────

export interface StudentSession {
  sessionId: string;
  name: string;
  rollNumber: string;
  startedAt: string;
  startedAtMs: number;
  currentLevel: number;
  completions: LevelCompletion[];
}

export interface LevelCompletion {
  levelId: number;
  completedAt: string;
  blocksUsed: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  rollNumber: string;
  finishedAt: string | null;
  totalSeconds: number | null;
  totalBlocksUsed: number;
  levelsCompleted: number;
}

// ─── Drag-and-drop ────────────────────────────────────────────────────────────

export interface DragItem {
  source: "palette" | "track";
  trackIndex?: number;
  command: Command;
}
