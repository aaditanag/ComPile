import type { Level, TargetCell, PaintColor } from "./types";

// Helper to quickly build colored target arrays
function cells(color: PaintColor, coords: [number, number][]): TargetCell[] {
  return coords.map(([col, row]) => ({ col, row, color }));
}
function mix(...groups: TargetCell[][]): TargetCell[] {
  return groups.flat();
}

const LEVELS: Level[] = [

  // ─── Level 1 ─── Sequencing: straight amber line ─────────────────────────
  // Bot starts on the line. Teach: forward, paint.
  // Solution: paint, fwd, paint × 6 = 13 blocks (no loop yet)
  {
    id: 1,
    title: "First Steps",
    goalText: "Paint every amber cell — move forward and paint each one",
    gridSize: { cols: 9, rows: 7 },
    start: { col: 1, row: 3, facing: "right" },
    targetCells: cells("amber", [[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3]]),
    allowedBlocks: ["forward", "paint"],
    blockBudget: null,
    concept: "sequencing",
  },

  // ─── Level 2 ─── Turns: L-shape, single color ────────────────────────────
  // Teach: turns without changing paint color for simplicity.
  // Solution: paint+fwd × 4, turnRight, paint+fwd × 3, paint
  {
    id: 2,
    title: "Turn the Corner",
    goalText: "Follow the L-shape — go right, then turn and go down",
    gridSize: { cols: 9, rows: 8 },
    start: { col: 1, row: 2, facing: "right" },
    targetCells: mix(
      cells("amber",  [[1,2],[2,2],[3,2],[4,2],[5,2]]),
      cells("teal",   [[5,3],[5,4],[5,5],[5,6]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint"],
    blockBudget: null,
    concept: "sequencing-turns",
  },

  // ─── Level 3 ─── Loops: repeated row, single color ────────────────────────
  // Teach the loop mechanic clearly with a simple shape.
  // Start on first amber cell. Loop ×4 [paint, fwd] + final paint paints 5 cells.
  // Teal cells add a second color target — just paint+fwd in a different order.
  // Solution: ×4[■amber, ↑], ■amber  = loop ×4 [paint amber, fwd] + paint amber
  {
    id: 3,
    title: "Repeat It",
    goalText: "Use a loop — paint 5 amber cells in a row with as few blocks as possible",
    gridSize: { cols: 9, rows: 7 },
    start: { col: 2, row: 3, facing: "right" },
    targetCells: cells("amber", [[2,3],[3,3],[4,3],[5,3],[6,3]]),
    allowedBlocks: ["forward", "paint", "loop"],
    blockBudget: null,
    concept: "loops-intro",
  },

  // ─── Level 4 ─── Loops + turns: staircase, 2 colors ─────────────────────
  // Now introduce a staircase with loops. Start on first step (amber cell).
  // Pattern: each step = paint amber, turn up, fwd, paint teal, turn right, fwd.
  // Loop ×3 then final paint amber.
  // Note: no cell belongs to two colors — corner cells are unambiguous.
  {
    id: 4,
    title: "Staircase",
    goalText: "Use a loop — each step: amber cell, then teal cell above it",
    gridSize: { cols: 10, rows: 9 },
    start: { col: 1, row: 7, facing: "right" },
    targetCells: mix(
      cells("amber",  [[1,7],[2,6],[3,5],[4,4]]),
      cells("teal",   [[1,6],[2,5],[3,4]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop"],
    blockBudget: null,
    concept: "loops",
  },

  // ─── Level 5 ─── Loops: rectangle ring (no procedure yet) ────────────────
  // Clean ring, each side a different color, no corner conflicts.
  // Corners belong to the HORIZONTAL side.
  // Start at top-left corner (amber).
  // Solution uses 4 loops (or sides) — or one big sequence. Loop level!
  //
  // Ring: cols 2-8, rows 2-7
  // Top (amber):   (2,2),(3,2),(4,2),(5,2),(6,2),(7,2),(8,2)
  // Right (teal):  (8,3),(8,4),(8,5),(8,6),(8,7)
  // Bottom (amber): (7,7),(6,7),(5,7),(4,7),(3,7),(2,7)
  // Left (purple): (2,6),(2,5),(2,4),(2,3)
  {
    id: 5,
    title: "Ring Loop",
    goalText: "Trace the 3-color ring — top/bottom amber, right teal, left purple",
    gridSize: { cols: 12, rows: 11 },
    start: { col: 2, row: 2, facing: "right" },
    targetCells: mix(
      cells("amber",  [[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2]]),
      cells("teal",   [[8,3],[8,4],[8,5],[8,6],[8,7]]),
      cells("amber",  [[7,7],[6,7],[5,7],[4,7],[3,7],[2,7]]),
      cells("purple", [[2,6],[2,5],[2,4],[2,3]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop"],
    blockBudget: null,
    concept: "loops-shapes",
  },

  // ─── Level 6 ─── Procedures intro: 3 identical notch shapes ─────────────
  // The SAME notch (3-cell L) appears 3 times — perfect for a procedure.
  // Start at (1,5). Each notch = fwd, paint amber, turn left, fwd, paint teal, turn right.
  // Define P1 as the notch body, call it 3 times.
  {
    id: 6,
    title: "Notch Pattern",
    goalText: "Define a procedure for the repeating notch, then call it 3 times",
    gridSize: { cols: 13, rows: 9 },
    start: { col: 1, row: 5, facing: "right" },
    targetCells: mix(
      // notch 1 — amber base, teal peak
      cells("amber",  [[1,5],[2,5],[3,5]]),
      cells("teal",   [[2,4]]),
      // notch 2
      cells("amber",  [[5,5],[6,5],[7,5]]),
      cells("teal",   [[6,4]]),
      // notch 3
      cells("amber",  [[9,5],[10,5],[11,5]]),
      cells("teal",   [[10,4]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "callProc"],
    blockBudget: null,
    concept: "procedures-intro",
  },

  // ─── Level 7 ─── Procedures: symmetric frame ─────────────────────────────
  // Two identical side pillars (purple) + top/bottom rails (amber) + inner accents (teal).
  // Start on top-left rail cell (amber).
  {
    id: 7,
    title: "Symmetric Frame",
    goalText: "Use two procedures to build the symmetric frame — P1 for pillars, P2 for accents",
    gridSize: { cols: 15, rows: 11 },
    start: { col: 1, row: 3, facing: "right" },
    targetCells: mix(
      // Top rail — amber
      cells("amber",  [[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3]]),
      // Bottom rail — amber
      cells("amber",  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7]]),
      // Left pillar — purple
      cells("purple", [[1,4],[1,5],[1,6]]),
      // Right pillar — purple
      cells("purple", [[13,4],[13,5],[13,6]]),
      // Inner accent left — teal
      cells("teal",   [[4,4],[4,5],[4,6]]),
      // Inner accent right — teal
      cells("teal",   [[10,4],[10,5],[10,6]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop", "callProc"],
    blockBudget: null,
    concept: "procedures",
  },

  // ─── Level 8 ─── Loops + procedures: ring with notch ────────────────────
  // The open ring from an earlier concept, now needing both loops and procedures.
  // Start on the top-left amber cell.
  // Amber top, purple left, teal right+bottom (with notch at bottom-right).
  {
    id: 8,
    title: "Open Ring",
    goalText: "Amber top, purple left, teal right & bottom — with a notch at the corner",
    gridSize: { cols: 15, rows: 12 },
    start: { col: 2, row: 2, facing: "right" },
    targetCells: mix(
      // top bar — amber (start is (2,2))
      cells("amber",  [[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2]]),
      // left bar — purple
      cells("purple", [[2,3],[2,4],[2,5],[2,6],[2,7],[2,8]]),
      // right bar — teal (notch: ends at row 7, no (11,8))
      cells("teal",   [[11,3],[11,4],[11,5],[11,6],[11,7]]),
      // bottom bar — teal (open at right)
      cells("teal",   [[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop", "callProc"],
    blockBudget: null,
    concept: "loops-procedures",
  },

  // ─── Level 9 ─── Block budget: same as L5 ring, budget = 12 ──────────────
  // Same ring as level 5. Must use loops efficiently.
  // Tight budget — ring shape, 4 sides.
  // Optimal 16-block solution: Loop×5[■amber ↑] + ■amber + ↷ + Loop×4[↑ ■teal] + ↷ + Loop×5[↑ ■amber] + ↷ + Loop×4[↑ ■purple]
  // Budget of 16 forces loop use but is genuinely achievable.
  {
    id: 9,
    title: "Compressed Ring",
    goalText: "Budget: 20 blocks max — compress every side of the ring with loops!",
    gridSize: { cols: 12, rows: 11 },
    start: { col: 2, row: 2, facing: "right" },
    targetCells: mix(
      cells("amber",  [[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2]]),
      cells("teal",   [[8,3],[8,4],[8,5],[8,6],[8,7]]),
      cells("amber",  [[7,7],[6,7],[5,7],[4,7],[3,7],[2,7]]),
      cells("purple", [[2,6],[2,5],[2,4],[2,3]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop", "callProc"],
    blockBudget: 20,
    concept: "block-budget",
  },

  // ─── Level 10 ─── H-shape: two amber rails + two purple spines + teal center ─
  // Optimal ~18-block solution:
  //   P1 = Loop×6[↑ ■purple]   (spine — move then paint, 6 cells)
  //   P2 = Loop×6[■teal ↑]     (center — paint then move, 6 cells)
  //   P3 = Loop×14[■amber ↑] ■amber  (rail — 15 cells)
  //
  //   Main: P3, ↷, P1, ↑, ↷, P3, ↷, P1, ↷, ↑×7, ↷, P2  = 18 blocks
  {
    id: 10,
    title: "The Final Form",
    goalText: "Budget: 25 blocks — paint the H with rails, spines, and a center column. Use loops + functions!",
    gridSize: { cols: 17, rows: 12 },
    start: { col: 1, row: 2, facing: "right" },
    targetCells: mix(
      // Top rail — amber
      cells("amber",  [[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2]]),
      // Bottom rail — amber
      cells("amber",  [[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9]]),
      // Left spine — purple
      cells("purple", [[1,3],[1,4],[1,5],[1,6],[1,7],[1,8]]),
      // Right spine — purple
      cells("purple", [[15,3],[15,4],[15,5],[15,6],[15,7],[15,8]]),
      // Center column — teal
      cells("teal",   [[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]])
    ),
    allowedBlocks: ["forward", "turnLeft", "turnRight", "paint", "loop", "callProc"],
    blockBudget: 25,
    concept: "block-budget-hard",
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getAllLevels(): Level[] {
  return LEVELS;
}

export default LEVELS;
