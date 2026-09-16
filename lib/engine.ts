import type {
  Command,
  Procedures,
  Level,
  BotState,
  PaintedCell,
  PaintColor,
  StepFrame,
  RunResult,
} from "./types";
import { FACING_DELTA, TURN_LEFT, TURN_RIGHT } from "./types";

const MAX_STEPS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellKey(c: number, r: number): string {
  return `${c},${r}`;
}

function countCommands(program: Command[]): number {
  let n = 0;
  for (const cmd of program) {
    n++;
    if (cmd.type === "loop") n += countCommands(cmd.body);
  }
  return n;
}

// ─── Expander ─────────────────────────────────────────────────────────────────

type PrimitiveCmd =
  | { op: "forward" }
  | { op: "turnLeft" }
  | { op: "turnRight" }
  | { op: "paint"; color: PaintColor };

function expand(
  program: Command[],
  procedures: Procedures,
  depth: number,
  budget: { count: number }
): PrimitiveCmd[] {
  if (depth > 20) throw new Error("Recursion too deep — check for circular procedure calls.");

  const out: PrimitiveCmd[] = [];

  for (const cmd of program) {
    if (budget.count > MAX_STEPS) throw new Error("Program exceeds maximum step limit.");

    switch (cmd.type) {
      case "forward":   out.push({ op: "forward" });   budget.count++; break;
      case "turnLeft":  out.push({ op: "turnLeft" });  budget.count++; break;
      case "turnRight": out.push({ op: "turnRight" }); budget.count++; break;
      case "paint":     out.push({ op: "paint", color: cmd.color }); budget.count++; break;

      case "loop": {
        const times = Math.max(1, Math.min(20, cmd.count));
        for (let i = 0; i < times; i++) {
          const inner = expand(cmd.body, procedures, depth + 1, budget);
          out.push(...inner);
          if (budget.count > MAX_STEPS) throw new Error("Program exceeds maximum step limit.");
        }
        break;
      }

      case "callProc": {
        const body = procedures[cmd.procId];
        if (!body || body.length === 0) break;
        const inner = expand(body, procedures, depth + 1, budget);
        out.push(...inner);
        break;
      }
    }
  }

  return out;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export function runProgram(
  program: Command[],
  level: Level,
  procedures: Procedures = { purple: [], teal: [], amber: [] }
): RunResult {
  const { gridSize, start, targetCells } = level;

  // Expand to flat trace
  let trace: PrimitiveCmd[];
  try {
    trace = expand(program, procedures, 0, { count: 0 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { frames: [], paintedCells: [], success: false, error: msg };
  }

  // Simulate — painted: key → color actually applied
  let bot: BotState = { col: start.col, row: start.row, facing: start.facing };
  const painted = new Map<string, PaintColor>();
  const frames: StepFrame[] = [];

  frames.push({ bot: { ...bot }, paintedCells: [], action: "none" });

  for (const cmd of trace) {
    let nextBot = { ...bot };
    let error: string | undefined;

    switch (cmd.op) {
      case "forward": {
        const delta = FACING_DELTA[bot.facing];
        nextBot.col = bot.col + delta.dc;
        nextBot.row = bot.row + delta.dr;
        if (
          nextBot.col < 0 || nextBot.col >= gridSize.cols ||
          nextBot.row < 0 || nextBot.row >= gridSize.rows
        ) {
          error = `Bot walked off the grid at (${nextBot.col}, ${nextBot.row}).`;
        }
        break;
      }
      case "turnLeft":  nextBot.facing = TURN_LEFT[bot.facing];  break;
      case "turnRight": nextBot.facing = TURN_RIGHT[bot.facing]; break;
      case "paint":
        painted.set(cellKey(bot.col, bot.row), cmd.color);
        break;
    }

    if (error) {
      const snapshot = snapshotCells(painted);
      frames.push({ bot: nextBot, paintedCells: snapshot, action: cmd.op === "paint" ? "paint" : cmd.op, error });
      return { frames, paintedCells: snapshot, success: false, error };
    }

    bot = nextBot;
    frames.push({
      bot: { ...bot },
      paintedCells: snapshotCells(painted),
      action: cmd.op === "paint" ? "paint" : cmd.op,
    });
  }

  // ── Success check ─────────────────────────────────────────────────────────
  // Every target cell must be painted with the CORRECT color.
  // No extra cells may be painted (regardless of color).
  const paintedArr = snapshotCells(painted);
  const targetMap = new Map(targetCells.map((t) => [cellKey(t.col, t.row), t.color]));

  let success = true;
  let errorMsg: string | undefined;

  // All targets must be painted correctly
  for (const [key, requiredColor] of targetMap) {
    const actual = painted.get(key);
    if (!actual) {
      success = false;
      errorMsg = "Not all target cells were painted.";
      break;
    }
    if (actual !== requiredColor) {
      success = false;
      errorMsg = `Wrong color at (${key}) — expected ${requiredColor}, got ${actual}.`;
      break;
    }
  }

  // No extra cells
  if (success) {
    for (const [key] of painted) {
      if (!targetMap.has(key)) {
        success = false;
        errorMsg = "Bot painted cells outside the target shape.";
        break;
      }
    }
  }

  return { frames, paintedCells: paintedArr, success, error: errorMsg };
}

function snapshotCells(painted: Map<string, PaintColor>): PaintedCell[] {
  return Array.from(painted.entries()).map(([key, color]) => {
    const [c, r] = key.split(",").map(Number);
    return { col: c, row: r, color };
  });
}

// ─── Block counter ────────────────────────────────────────────────────────────

/** Collect all procedure IDs that are actually called, transitively. */
function collectCalledProcs(cmds: Command[], found: Set<string>): void {
  for (const cmd of cmds) {
    if (cmd.type === "callProc" && !found.has(cmd.procId)) {
      found.add(cmd.procId);
    }
    if (cmd.type === "loop") {
      collectCalledProcs(cmd.body, found);
    }
  }
}

/**
 * Count blocks used — only includes procedure bodies that are actually
 * called (directly or transitively) from the main program.
 * Procedures defined but never called do NOT count toward the budget.
 */
export function countTotalBlocks(
  program: Command[],
  procedures: Procedures
): number {
  // Find all procedure IDs reachable from main program
  const called = new Set<string>();
  collectCalledProcs(program, called);

  // Also collect procs called by those procs (transitive)
  let prevSize = -1;
  while (prevSize !== called.size) {
    prevSize = called.size;
    for (const id of [...called]) {
      const body = procedures[id as keyof Procedures];
      if (body) collectCalledProcs(body, called);
    }
  }

  // Count main program + only reachable procedure bodies
  let n = countCommands(program);
  for (const [id, proc] of Object.entries(procedures)) {
    if (called.has(id) && proc.length > 0) {
      n += countCommands(proc);
    }
  }
  return n;
}

