"use client";

import { create } from "zustand";
import type { Command, ProcId, Procedures, StepFrame } from "@/lib/types";

export type ExecutionState = "idle" | "running" | "success" | "error";

interface GameStore {
  // Program builder
  program: Command[];
  procedures: Procedures;
  activeEditProc: ProcId | null;

  // Run / Animation
  executionState: ExecutionState;
  frames: StepFrame[];
  currentFrame: number;
  errorMessage: string | null;

  // Actions — Program
  appendCommand: (cmd: Command, target?: "main" | ProcId) => void;
  removeCommand: (index: number, target?: "main" | ProcId) => void;
  updateCommand: (index: number, cmd: Command, target?: "main" | ProcId) => void;
  moveCommand: (fromIndex: number, toIndex: number, target?: "main" | ProcId) => void;
  resetProgram: () => void;

  // Actions — Procedures
  setActiveEditProc: (id: ProcId | null) => void;

  // Actions — Execution
  setExecutionState: (state: ExecutionState) => void;
  setFrames: (frames: StepFrame[]) => void;
  setCurrentFrame: (n: number) => void;
  setError: (msg: string | null) => void;
  resetExecution: () => void;
}

function getTarget(
  state: GameStore,
  target: "main" | ProcId = "main"
): Command[] {
  if (target === "main") return state.program;
  return state.procedures[target];
}

export const useGameStore = create<GameStore>((set, get) => ({
  program: [],
  procedures: { purple: [], teal: [], amber: [] },
  activeEditProc: null,

  executionState: "idle",
  frames: [],
  currentFrame: 0,
  errorMessage: null,

  // ── Program mutations ──────────────────────────────────────────────────────

  appendCommand: (cmd, target = "main") =>
    set((state) => {
      if (target === "main") {
        return { program: [...state.program, cmd] };
      }
      return {
        procedures: {
          ...state.procedures,
          [target]: [...state.procedures[target], cmd],
        },
      };
    }),

  removeCommand: (index, target = "main") =>
    set((state) => {
      if (target === "main") {
        const next = [...state.program];
        next.splice(index, 1);
        return { program: next };
      }
      const next = [...state.procedures[target]];
      next.splice(index, 1);
      return { procedures: { ...state.procedures, [target]: next } };
    }),

  updateCommand: (index, cmd, target = "main") =>
    set((state) => {
      if (target === "main") {
        const next = [...state.program];
        next[index] = cmd;
        return { program: next };
      }
      const next = [...state.procedures[target]];
      next[index] = cmd;
      return { procedures: { ...state.procedures, [target]: next } };
    }),

  moveCommand: (fromIndex, toIndex, target = "main") =>
    set((state) => {
      const src = [...getTarget(state, target)];
      const [item] = src.splice(fromIndex, 1);
      src.splice(toIndex, 0, item);
      if (target === "main") return { program: src };
      return { procedures: { ...state.procedures, [target]: src } };
    }),

  resetProgram: () =>
    set({
      program: [],
      procedures: { purple: [], teal: [], amber: [] },
      activeEditProc: null,
      executionState: "idle",
      frames: [],
      currentFrame: 0,
      errorMessage: null,
    }),

  // ── Procedures ─────────────────────────────────────────────────────────────

  setActiveEditProc: (id) => set({ activeEditProc: id }),

  // ── Execution ──────────────────────────────────────────────────────────────

  setExecutionState: (executionState) => set({ executionState }),
  setFrames: (frames) => set({ frames }),
  setCurrentFrame: (n) => set({ currentFrame: n }),
  setError: (errorMessage) => set({ errorMessage }),
  resetExecution: () =>
    set({
      executionState: "idle",
      frames: [],
      currentFrame: 0,
      errorMessage: null,
    }),
}));
