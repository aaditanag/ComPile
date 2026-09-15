"use client";

import React, { useState } from "react";
import type { Command, LoopCmd, PaintColor } from "@/lib/types";
import { PAINT_HEX } from "@/lib/types";

interface LoopEditorProps {
  loop: LoopCmd;
  index: number;           // position in parent program
  onSave: (updated: LoopCmd) => void;
  onClose: () => void;
}

const PAINT_COLORS: PaintColor[] = ["amber", "purple", "teal"];

export default function LoopEditor({ loop, onSave, onClose }: LoopEditorProps) {
  const [count, setCount] = useState(loop.count);
  const [body, setBody]   = useState<Command[]>([...loop.body]);
  const [countInput, setCountInput] = useState(String(loop.count));

  const addCmd = (cmd: Command) => setBody((b) => [...b, cmd]);
  const removeCmd = (i: number) => setBody((b) => b.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({ type: "loop", count, body });
    onClose();
  };

  const getCmdLabel = (cmd: Command) => {
    switch (cmd.type) {
      case "forward":   return "↑";
      case "turnLeft":  return "↶";
      case "turnRight": return "↷";
      case "paint":     return "■";
      case "loop":      return `×${cmd.count}`;
      case "callProc":  return cmd.procId === "purple" ? "P1" : cmd.procId === "teal" ? "P2" : "P3";
    }
  };

  const getCmdColor = (cmd: Command) => {
    if (cmd.type === "paint") return PAINT_HEX[cmd.color];
    if (cmd.type === "loop") return "#2fd9c5";
    return "var(--color-text)";
  };

  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="loop-editor" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="loop-editor__header">
          <span className="loop-editor__title">🔁 Edit Loop</span>
          <button className="htp-close" onClick={onClose}>✕</button>
        </div>

        {/* How-to note */}
        <div className="loop-editor__note">
          <span className="loop-editor__note-icon">💡</span>
          <span>
            Add command blocks below — they will repeat <strong>{count} times</strong> when your program runs.
            Put the loop at the <em>start</em> of your program before any moves.
          </span>
        </div>

        {/* Count picker */}
        <div className="loop-editor__count-row">
          <span className="loop-editor__count-label">Repeat</span>
          <div className="loop-editor__count-btns">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                className={`loop-count-btn ${count === n ? "loop-count-btn--active" : ""}`}
                onClick={() => { setCount(n); setCountInput(String(n)); }}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="loop-editor__count-label">times</span>
          {/* Manual input for keyboard users */}
          <input
            className="loop-editor__count-input"
            type="number"
            min={2}
            max={20}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            onBlur={() => {
              const n = Math.max(2, Math.min(20, parseInt(countInput) || 3));
              setCount(n);
              setCountInput(String(n));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = Math.max(2, Math.min(20, parseInt(countInput) || 3));
                setCount(n);
                setCountInput(String(n));
              }
            }}
          />
        </div>

        {/* Mini palette — add commands to body */}
        <div className="loop-editor__palette-label">Commands inside the loop:</div>
        <div className="loop-editor__palette">
          {/* Move buttons */}
          {(["forward", "turnLeft", "turnRight"] as const).map((t) => (
            <button
              key={t}
              className="cmd-block cmd-block--small cmd-block--move"
              title={t}
              onClick={() => addCmd({ type: t })}
            >
              {t === "forward" ? "↑" : t === "turnLeft" ? "↶" : "↷"}
            </button>
          ))}

          {/* Paint buttons — one per color */}
          {PAINT_COLORS.map((pc) => (
            <button
              key={pc}
              className="cmd-block cmd-block--small"
              style={{ background: PAINT_HEX[pc], color: "#14161f", border: "none" }}
              title={`Paint ${pc}`}
              onClick={() => addCmd({ type: "paint", color: pc })}
            >
              ■
            </button>
          ))}
        </div>

        {/* Body strip */}
        <div className="loop-editor__body">
          {body.length === 0 && (
            <span className="loop-editor__empty">
              Empty loop — click commands above to add them
            </span>
          )}
          {body.map((cmd, i) => (
            <div key={i} className="loop-body-block">
              <span className="loop-body-block__label" style={{ color: getCmdColor(cmd) }}>
                {getCmdLabel(cmd)}
              </span>
              <button
                className="loop-body-block__remove"
                onClick={() => removeCmd(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        {body.length > 0 && (
          <div className="loop-editor__summary">
            This loop runs <strong>{body.length} command{body.length !== 1 ? "s" : ""}</strong> × <strong>{count}</strong> = <strong>{body.length * count}</strong> total steps
          </div>
        )}

        {/* Footer */}
        <div className="htp-footer">
          <button className="htp-btn htp-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="htp-btn htp-btn--primary" onClick={handleSave}>
            Save Loop ✓
          </button>
        </div>
      </div>
    </div>
  );
}
