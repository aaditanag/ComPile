"use client";

import React, { useState } from "react";
import type { Command, CommandType, LoopCmd, ProcId, PaintColor } from "@/lib/types";
import { PAINT_HEX } from "@/lib/types";
import LoopEditor from "./LoopEditor";

interface ProgramTrackProps {
  program: Command[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, cmd: Command) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDrop: (cmd: Command) => void;
  onReset: () => void;
  onRun: () => void;
  isRunning: boolean;
  blockBudget: number | null;
  totalBlocks: number;
  autoEditLoopIdx: number | null;
  onAutoEditDone: () => void;
}

const PROC_COLORS: Record<ProcId, string> = {
  purple: "#8b7cf0",
  teal:   "#2fd9c5",
  amber:  "#f2b640",
};

function getCmdLabel(cmd: Command): string {
  switch (cmd.type) {
    case "forward":   return "↑";
    case "turnLeft":  return "↶";
    case "turnRight": return "↷";
    case "paint":     return "■";
    case "loop":      return `×${cmd.count}`;
    case "callProc":  return cmd.procId === "purple" ? "P1" : cmd.procId === "teal" ? "P2" : "P3";
  }
}

function getCmdColor(cmd: Command): string {
  switch (cmd.type) {
    case "forward":
    case "turnLeft":
    case "turnRight": return "var(--color-text)";
    case "paint":     return PAINT_HEX[cmd.color];
    case "loop":      return "#2fd9c5";
    case "callProc":  return PROC_COLORS[cmd.procId];
  }
}

interface BlockProps {
  cmd: Command;
  index: number;
  autoOpen: boolean;        // if true, open LoopEditor immediately on mount
  onAutoOpenDone: () => void;
  onRemove: () => void;
  onUpdate: (cmd: Command) => void;
  dragging: number | null;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
}

function Block({
  cmd,
  index,
  autoOpen,
  onAutoOpenDone,
  onRemove,
  onUpdate,
  dragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}: BlockProps) {
  const [editingLoop, setEditingLoop] = useState(autoOpen);
  const color = getCmdColor(cmd);

  // When autoOpen fires after mount, open the editor
  React.useEffect(() => {
    if (autoOpen) {
      setEditingLoop(true);
      onAutoOpenDone(); // clear the flag immediately so it doesn't re-trigger
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  return (
    <>
      <div
        className={`track-block${dragging === index ? " track-block--dragging" : ""}${cmd.type === "loop" ? " track-block--loop" : ""}`}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
        onDragEnd={onDragEnd}
        title={cmd.type === "loop" ? `Loop ×${(cmd as LoopCmd).count} — ${(cmd as LoopCmd).body.length} commands inside` : cmd.type}
      >
        <span className="track-block__label" style={{ color }}>
          {getCmdLabel(cmd)}
        </span>

        {/* Loop: show body count badge + open editor on click */}
        {cmd.type === "loop" && (
          <button
            className="track-block__edit"
            title="Edit loop body and count"
            onClick={() => setEditingLoop(true)}
          >
            {(cmd as LoopCmd).body.length > 0
              ? `${(cmd as LoopCmd).body.length}cmd`
              : "✏"}
          </button>
        )}

        {/* Remove */}
        <button
          className="track-block__remove"
          title="Remove block"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      {/* Full loop editor modal */}
      {cmd.type === "loop" && editingLoop && (
        <LoopEditor
          loop={cmd as LoopCmd}
          index={index}
          onSave={(updated) => onUpdate(updated)}
          onClose={() => setEditingLoop(false)}
        />
      )}
    </>
  );
}

export default function ProgramTrack({
  program,
  onRemove,
  onUpdate,
  onMove,
  onDrop,
  onReset,
  onRun,
  isRunning,
  blockBudget,
  totalBlocks,
  autoEditLoopIdx,
  onAutoEditDone,
}: ProgramTrackProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const overBudget = blockBudget !== null && totalBlocks > blockBudget;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.source === "palette") {
        let newCmd: Command;
        switch (data.type as CommandType) {
          case "forward":   newCmd = { type: "forward" }; break;
          case "turnLeft":  newCmd = { type: "turnLeft" }; break;
          case "turnRight": newCmd = { type: "turnRight" }; break;
          case "paint":     newCmd = { type: "paint", color: (data.paintColor ?? "amber") as PaintColor }; break;
          case "loop":      newCmd = { type: "loop", count: 3, body: [] }; break;
          case "callProc":  newCmd = { type: "callProc", procId: data.procId ?? "purple" }; break;
          default: return;
        }
        onDrop(newCmd);
      }
    } catch {
      // ignore
    }
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      onMove(dragging, dragOver);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="program-track">
      {/* Reset */}
      <button
        id="btn-reset"
        className="track-ctrl track-ctrl--reset"
        title="Reset program"
        onClick={onReset}
        disabled={isRunning}
      >
        ↺
      </button>

      {/* Block strip */}
      <div
        className="track-strip"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {program.length === 0 && (
          <span className="track-empty">
            Click or drag blocks from the palette →
          </span>
        )}
        {program.map((cmd, i) => (
          <Block
            key={i}
            cmd={cmd}
            index={i}
            autoOpen={autoEditLoopIdx === i}
            onAutoOpenDone={onAutoEditDone}
            onRemove={() => onRemove(i)}
            onUpdate={(updated) => onUpdate(i, updated)}
            dragging={dragging}
            onDragStart={setDragging}
            onDragOver={setDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Block count */}
      {blockBudget !== null && (
        <span
          className={`track-budget ${overBudget ? "track-budget--over" : ""}`}
        >
          {totalBlocks}/{blockBudget}
        </span>
      )}

      {/* Run */}
      <button
        id="btn-run"
        className="track-ctrl track-ctrl--run"
        title="Run program"
        onClick={onRun}
        disabled={isRunning || overBudget}
      >
        {isRunning ? "⏸" : "▶"}
      </button>
    </div>
  );
}
