"use client";

import React from "react";
import type { CommandType, ProcId, PaintColor } from "@/lib/types";
import { PAINT_HEX } from "@/lib/types";

interface CommandPaletteProps {
  allowedBlocks: CommandType[];
  onAdd: (type: CommandType, procId?: ProcId, paintColor?: PaintColor) => void;
  onDefineProc: (id: ProcId) => void;
}

const PROC_COLORS: Record<ProcId, string> = {
  purple: "#8b7cf0",
  teal:   "#2fd9c5",
  amber:  "#f2b640",
};

const PROC_LABELS: Record<ProcId, string> = {
  purple: "P1",
  teal:   "P2",
  amber:  "P3",
};

const PROC_IDS: ProcId[] = ["purple", "teal", "amber"];
const PAINT_COLORS: PaintColor[] = ["amber", "purple", "teal"];
const PAINT_LABELS: Record<PaintColor, string> = { amber: "■", purple: "■", teal: "■" };
const PAINT_TITLES: Record<PaintColor, string> = {
  amber:  "Paint amber (yellow)",
  purple: "Paint purple",
  teal:   "Paint teal",
};

export default function CommandPalette({
  allowedBlocks,
  onAdd,
  onDefineProc,
}: CommandPaletteProps) {
  const has = (t: CommandType) => allowedBlocks.includes(t);

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    type: CommandType,
    procId?: ProcId,
    paintColor?: PaintColor
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "palette", type, procId, paintColor })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="palette">
      {/* ── Move ──────────────────────────────────────────────────────── */}
      {(has("forward") || has("turnLeft") || has("turnRight")) && (
        <section className="palette-section">
          <span className="palette-label">Move</span>
          <div className="palette-row">
            {has("forward") && (
              <button
                className="cmd-block cmd-block--move"
                title="Move forward"
                draggable
                onDragStart={(e) => handleDragStart(e, "forward")}
                onClick={() => onAdd("forward")}
              >↑</button>
            )}
            {has("turnLeft") && (
              <button
                className="cmd-block cmd-block--move"
                title="Turn left"
                draggable
                onDragStart={(e) => handleDragStart(e, "turnLeft")}
                onClick={() => onAdd("turnLeft")}
              >↶</button>
            )}
            {has("turnRight") && (
              <button
                className="cmd-block cmd-block--move"
                title="Turn right"
                draggable
                onDragStart={(e) => handleDragStart(e, "turnRight")}
                onClick={() => onAdd("turnRight")}
              >↷</button>
            )}
          </div>
        </section>
      )}

      {/* ── Paint ─────────────────────────────────────────────────────── */}
      {has("paint") && (
        <section className="palette-section">
          <span className="palette-label">Paint</span>
          <div className="palette-row">
            {PAINT_COLORS.map((color) => (
              <button
                key={color}
                className="cmd-block cmd-block--paint"
                style={{ background: PAINT_HEX[color] }}
                title={PAINT_TITLES[color]}
                draggable
                onDragStart={(e) => handleDragStart(e, "paint", undefined, color)}
                onClick={() => onAdd("paint", undefined, color)}
              >
                {PAINT_LABELS[color]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Loop ──────────────────────────────────────────────────────── */}
      {has("loop") && (
        <section className="palette-section">
          <span className="palette-label">Loop</span>
          <div className="palette-row">
            <button
              className="cmd-block cmd-block--loop"
              title="Add a loop block — click ✏ on it in the track to set count and add commands inside"
              draggable
              onDragStart={(e) => handleDragStart(e, "loop")}
              onClick={() => onAdd("loop")}
            >×N</button>
          </div>
          <p className="palette-loop-note">
            ① Add loop to track<br/>
            ② Click <strong>✏</strong> on it to set count &amp; add commands inside
          </p>
        </section>
      )}

      {/* ── Functions ─────────────────────────────────────────────────── */}
      {has("callProc") && (
        <section className="palette-section">
          <span className="palette-label">Functions</span>
          <div className="palette-row">
            {PROC_IDS.map((id) => (
              <div key={id} className="proc-group">
                <button
                  className="cmd-block cmd-block--proc"
                  style={{ borderColor: PROC_COLORS[id], color: PROC_COLORS[id] }}
                  title={`Call ${id} function`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "callProc", id)}
                  onClick={() => onAdd("callProc", id)}
                >
                  {PROC_LABELS[id]}
                </button>
                <button
                  className="cmd-block cmd-block--proc-define"
                  style={{ color: PROC_COLORS[id], borderColor: PROC_COLORS[id] }}
                  title={`Define ${id} function`}
                  onClick={() => onDefineProc(id)}
                >+</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
