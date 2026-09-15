"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { runProgram, countTotalBlocks } from "@/lib/engine";
import { getLevel } from "@/lib/levels";
import type { Command, CommandType, ProcId, PaintColor, Procedures } from "@/lib/types";
import TopBar from "@/components/TopBar";
import GridPanel from "@/components/GridPanel";
import CommandPalette from "@/components/CommandPalette";
import ProgramTrack from "@/components/ProgramTrack";
import ProcedureEditor from "@/components/ProcedureEditor";
import HowToPlay from "@/components/HowToPlay";

const TOTAL_LEVELS = 10;
const CONTEST_DURATION_MS = 90 * 60 * 1000;
const FRAME_INTERVAL_MS = 140;

interface Session {
  sessionId: string;
  name: string;
  rollNumber: string;
  startedAt: string;
  startedAtMs: number;
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.level);
  const level = getLevel(levelId);

  const {
    program,
    procedures,
    activeEditProc,
    executionState,
    frames,
    currentFrame,
    appendCommand,
    removeCommand,
    updateCommand,
    moveCommand,
    resetProgram,
    setActiveEditProc,
    setExecutionState,
    setFrames,
    setCurrentFrame,
    setError,
    resetExecution,
  } = useGameStore();

  const [session, setSession] = useState<Session | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // index of a loop block that should auto-open its editor (set when adding a loop)
  const [autoEditLoopIdx, setAutoEditLoopIdx] = useState<number | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session
  useEffect(() => {
    const raw = sessionStorage.getItem("compile_session");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setSession(JSON.parse(raw));
    } catch {
      router.replace("/");
    }
  }, [router]);

  // Reset store on level change
  useEffect(() => {
    resetProgram();
    setSuccessMsg("");
    setErrorMsg("");
  }, [levelId, resetProgram]);

  // Guard
  if (!level) {
    return (
      <div className="play-error">
        <p>Level {levelId} not found.</p>
        <a href="/">Go home</a>
      </div>
    );
  }

  const totalBlocks = countTotalBlocks(program, procedures);
  const currentBot =
    frames.length > 0 && currentFrame < frames.length
      ? frames[currentFrame].bot
      : { col: level.start.col, row: level.start.row, facing: level.start.facing };
  const currentPainted =
    frames.length > 0 && currentFrame < frames.length
      ? frames[currentFrame].paintedCells
      : [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddCommand = useCallback(
    (type: CommandType, procId?: ProcId, paintColor?: PaintColor) => {
      let cmd: Command;
      switch (type) {
        case "forward":   cmd = { type: "forward" }; break;
        case "turnLeft":  cmd = { type: "turnLeft" }; break;
        case "turnRight": cmd = { type: "turnRight" }; break;
        case "paint":     cmd = { type: "paint", color: paintColor ?? "amber" }; break;
        case "loop":      cmd = { type: "loop", count: 3, body: [] }; break;
        case "callProc":  cmd = { type: "callProc", procId: procId ?? "purple" }; break;
        default: return;
      }
      appendCommand(cmd, "main");
      // Auto-open editor when a loop is added so user knows to fill the body
      if (type === "loop") {
        // program.length is the index of the item we just appended
        setAutoEditLoopIdx(program.length);
      }
    },
    [appendCommand, program.length]
  );

  const handleDrop = useCallback(
    (cmd: Command) => {
      appendCommand(cmd, "main");
      if (cmd.type === "loop") {
        setAutoEditLoopIdx(program.length);
      }
    },
    [appendCommand, program.length]
  );

  const handleRun = useCallback(() => {
    if (executionState === "running") return;
    resetExecution();
    setSuccessMsg("");
    setErrorMsg("");

    const result = runProgram(program, level, procedures);
    setFrames(result.frames);
    setExecutionState("running");
    setCurrentFrame(0);

    let frameIdx = 0;
    if (animRef.current) clearInterval(animRef.current);

    animRef.current = setInterval(() => {
      frameIdx++;
      setCurrentFrame(frameIdx);

      if (frameIdx >= result.frames.length - 1) {
        clearInterval(animRef.current!);

        if (result.success) {
          setExecutionState("success");
          setSuccessMsg("🎉 Level complete!");
          handleSubmit(result);
        } else {
          setExecutionState("error");
          setErrorMsg(result.error ?? "Incorrect — try again!");
        }
      }
    }, FRAME_INTERVAL_MS);
  }, [executionState, program, level, procedures, resetExecution, setFrames, setExecutionState, setCurrentFrame]);

  const handleSubmit = useCallback(
    async (result: { success: boolean }) => {
      if (!result.success || !session || submitting) return;
      setSubmitting(true);

      try {
        const res = await fetch("/api/level/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.sessionId,
            levelId,
            program,
            procedures,
          }),
        });
        const data = await res.json();

        if (data.isFinished) {
          setTimeout(() => router.push("/leaderboard"), 2000);
        } else if (data.nextLevel) {
          setTimeout(() => router.push(`/play/${data.nextLevel}`), 2000);
        }
      } catch {
        // Allow retry
      } finally {
        setSubmitting(false);
      }
    },
    [session, submitting, levelId, program, procedures, router]
  );

  const handleReset = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    resetProgram();
    setSuccessMsg("");
    setErrorMsg("");
  }, [resetProgram]);

  return (
    <div className="play-layout">
      {/* Top bar */}
      {session && (
        <div className="topbar-wrap">
          <TopBar
            levelId={levelId}
            levelCount={TOTAL_LEVELS}
            levelTitle={level.title}
            goalText={level.goalText}
            startedAt={session.startedAtMs}
            durationMs={CONTEST_DURATION_MS}
            totalBlocks={totalBlocks}
            blockBudget={level.blockBudget}
          />
          {/* How-to-play i-button */}
          <HowToPlay trigger="icon" />
        </div>
      )}

      {/* Main area */}
      <div className="play-main">
        {/* Grid */}
        <div className="play-grid-panel">
          <GridPanel
            level={level}
            bot={currentBot}
            paintedCells={currentPainted}
            executionState={executionState}
          />

          {/* Success / Error overlay */}
          {successMsg && (
            <div className="status-banner status-banner--success">
              {successMsg}
              {submitting && <span className="status-banner__spinner" />}
            </div>
          )}
          {errorMsg && (
            <div className="status-banner status-banner--error">
              ❌ {errorMsg}
            </div>
          )}
        </div>

        {/* Palette */}
        <div className="play-palette-panel">
          <CommandPalette
            allowedBlocks={level.allowedBlocks}
            onAdd={handleAddCommand}
            onDefineProc={(id) => setActiveEditProc(id)}
          />
        </div>
      </div>

      {/* Program track */}
      <ProgramTrack
        program={program}
        onRemove={(i) => removeCommand(i, "main")}
        onUpdate={(i, cmd) => updateCommand(i, cmd, "main")}
        onMove={(from, to) => moveCommand(from, to, "main")}
        onDrop={handleDrop}
        onReset={handleReset}
        onRun={handleRun}
        isRunning={executionState === "running"}
        blockBudget={level.blockBudget}
        totalBlocks={totalBlocks}
        autoEditLoopIdx={autoEditLoopIdx}
        onAutoEditDone={() => setAutoEditLoopIdx(null)}
      />

      {/* Procedure editor modal */}
      {activeEditProc && (
        <ProcedureEditor
          procId={activeEditProc}
          body={procedures[activeEditProc]}
          onClose={() => setActiveEditProc(null)}
          onAppend={(cmd, id) => appendCommand(cmd, id)}
          onRemove={(i, id) => removeCommand(i, id)}
          onUpdate={(i, cmd, id) => updateCommand(i, cmd, id)}
        />
      )}

      {/* How to play modal (from i-button) */}
      {showHelp && (
        <HowToPlay autoOpen onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
