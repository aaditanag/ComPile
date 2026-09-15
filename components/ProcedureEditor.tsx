"use client";

import React, { useState } from "react";
import type { Command, ProcId, PaintColor, LoopCmd } from "@/lib/types";
import { PAINT_HEX } from "@/lib/types";
import LoopEditor from "./LoopEditor";

interface ProcedureEditorProps {
  procId: ProcId;
  body: Command[];
  onClose: () => void;
  onAppend: (cmd: Command, target: ProcId) => void;
  onRemove: (index: number, target: ProcId) => void;
  onUpdate: (index: number, cmd: Command, target: ProcId) => void;
}

const PROC_COLORS: Record<ProcId, string> = {
  purple: "#8b7cf0",
  teal:   "#2fd9c5",
  amber:  "#f2b640",
};
const PROC_NAMES: Record<ProcId, string> = {
  purple: "Function P1",
  teal:   "Function P2",
  amber:  "Function P3",
};

const PAINT_COLORS: PaintColor[] = ["amber", "purple", "teal"];

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
  if (cmd.type === "paint") return PAINT_HEX[cmd.color];
  if (cmd.type === "loop")  return "#2fd9c5";
  return "var(--color-text)";
}

interface BodyBlockProps {
  cmd: Command;
  index: number;
  procId: ProcId;
  onRemove: () => void;
  onUpdate: (updated: Command) => void;
}

/** Renders one block in the procedure body. Loop blocks get a ✏ edit button. */
function BodyBlock({ cmd, index, onRemove, onUpdate }: BodyBlockProps) {
  const [editingLoop, setEditingLoop] = useState(false);
  const color = getCmdColor(cmd);

  return (
    <>
      <div
        className={`proc-block${cmd.type === "loop" ? " proc-block--loop" : ""}`}
        title={cmd.type === "loop" ? `Loop ×${(cmd as LoopCmd).count} — ${(cmd as LoopCmd).body.length} cmds` : cmd.type}
      >
        <span className="proc-block__label" style={{ color }}>
          {getCmdLabel(cmd)}
        </span>

        {/* Loop blocks: show body count + edit button */}
        {cmd.type === "loop" && (
          <button
            className="proc-block__edit"
            title="Edit loop inside function"
            onClick={() => setEditingLoop(true)}
          >
            {(cmd as LoopCmd).body.length > 0
              ? `${(cmd as LoopCmd).body.length}↗`
              : "✏"}
          </button>
        )}

        <button
          className="proc-block__remove"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      {/* Nested LoopEditor — opens over the procedure editor */}
      {cmd.type === "loop" && editingLoop && (
        <LoopEditor
          loop={cmd as LoopCmd}
          index={index}
          onSave={(updated) => {
            onUpdate(updated);
            setEditingLoop(false);
          }}
          onClose={() => setEditingLoop(false)}
        />
      )}
    </>
  );
}

export default function ProcedureEditor({
  procId,
  body,
  onClose,
  onAppend,
  onRemove,
  onUpdate,
}: ProcedureEditorProps) {
  const color = PROC_COLORS[procId];

  const addCmd = (type: Command["type"], paintColor?: PaintColor) => {
    let cmd: Command;
    switch (type) {
      case "forward":   cmd = { type: "forward" }; break;
      case "turnLeft":  cmd = { type: "turnLeft" }; break;
      case "turnRight": cmd = { type: "turnRight" }; break;
      case "paint":     cmd = { type: "paint", color: paintColor ?? "amber" }; break;
      case "loop":      cmd = { type: "loop", count: 3, body: [] }; break;
      default: return;
    }
    onAppend(cmd, procId);
  };

  return (
    <div className="proc-editor-overlay" onClick={onClose}>
      <div
        className="proc-editor"
        style={{ borderColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="proc-editor__header">
          <span style={{ color }} className="proc-editor__title">
            {PROC_NAMES[procId]}
          </span>
          <button className="proc-editor__close" onClick={onClose}>✕</button>
        </div>

        {/* Mini palette */}
        <div className="proc-editor__palette">
          {(["forward", "turnLeft", "turnRight"] as const).map((t) => (
            <button
              key={t}
              className="cmd-block cmd-block--small"
              title={t}
              onClick={() => addCmd(t)}
            >
              {t === "forward" ? "↑" : t === "turnLeft" ? "↶" : "↷"}
            </button>
          ))}

          {PAINT_COLORS.map((pc) => (
            <button
              key={pc}
              className="cmd-block cmd-block--small"
              style={{ background: PAINT_HEX[pc], color: "#14161f", border: "none" }}
              title={`Paint ${pc}`}
              onClick={() => addCmd("paint", pc)}
            >
              ■
            </button>
          ))}

          {/* Loop button — adds a loop block to the function */}
          <button
            className="cmd-block cmd-block--small cmd-block--loop"
            title="Add loop inside this function — click ✏ on it to configure"
            onClick={() => addCmd("loop")}
          >
            ×N
          </button>
        </div>

        <p className="palette-loop-note" style={{ margin: "0 4px 8px" }}>
          Click <strong>✏</strong> on a loop block below to set its count &amp; body
        </p>

        {/* Body strip */}
        <div className="proc-editor__body">
          {body.length === 0 && (
            <span className="proc-editor__empty">Empty — add commands above</span>
          )}
          {body.map((cmd, i) => (
            <BodyBlock
              key={i}
              cmd={cmd}
              index={i}
              procId={procId}
              onRemove={() => onRemove(i, procId)}
              onUpdate={(updated) => onUpdate(i, updated, procId)}
            />
          ))}
        </div>

        <button
          className="proc-editor__done"
          style={{ background: color }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
