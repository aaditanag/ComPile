"use client";

import React from "react";
import type { Level, BotState, PaintedCell, Facing, PaintColor } from "@/lib/types";
import { PAINT_HEX } from "@/lib/types";

const CELL_SIZE = 42;
const PADDING = 20;

interface GridPanelProps {
  level: Level;
  bot: BotState;
  paintedCells: PaintedCell[];
  executionState: "idle" | "running" | "success" | "error";
}

const FACING_ARROWS: Record<Facing, string> = {
  up:    "M0,-10 L6,5 L-6,5 Z",
  right: "M10,0 L-5,6 L-5,-6 Z",
  down:  "M0,10 L6,-5 L-6,-5 Z",
  left:  "M-10,0 L5,6 L5,-6 Z",
};

// Slightly dimmed hex for unpainted target cells
const DIM_HEX: Record<PaintColor, string> = {
  amber:  "#f2b64055",
  purple: "#8b7cf055",
  teal:   "#2fd9c555",
};

// Glow colors for painted cells
const GLOW_HEX: Record<PaintColor, string> = {
  amber:  "rgba(242,182,64,0.35)",
  purple: "rgba(139,124,240,0.35)",
  teal:   "rgba(47,217,197,0.35)",
};

export default function GridPanel({
  level,
  bot,
  paintedCells,
  executionState,
}: GridPanelProps) {
  const { gridSize, targetCells, start } = level;
  const cols = gridSize.cols;
  const rows = gridSize.rows;

  const svgWidth  = cols * CELL_SIZE + PADDING * 2;
  const svgHeight = rows * CELL_SIZE + PADDING * 2;

  // Maps for O(1) lookup
  const targetMap = new Map(targetCells.map((t) => [`${t.col},${t.row}`, t.color]));
  const paintedMap = new Map(paintedCells.map((p) => [`${p.col},${p.row}`, p.color]));

  const botX = PADDING + bot.col * CELL_SIZE + CELL_SIZE / 2;
  const botY = PADDING + bot.row * CELL_SIZE + CELL_SIZE / 2;

  const botColor =
    executionState === "success" ? "#2fd9c5"
    : executionState === "error"   ? "#ef4444"
    : "#eef0f7";

  return (
    <div className="grid-panel-wrapper">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        style={{ display: "block" }}
      >
        {/* Background */}
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#1c1f2b" />

        {/* ── Target cells (unpainted) — shown dimly in their required color ── */}
        {targetCells.map(({ col, row, color }) => {
          const key = `${col},${row}`;
          const isPainted = paintedMap.has(key);
          return (
            <rect
              key={`target-${key}`}
              x={PADDING + col * CELL_SIZE + 1}
              y={PADDING + row * CELL_SIZE + 1}
              width={CELL_SIZE - 2}
              height={CELL_SIZE - 2}
              fill={isPainted ? PAINT_HEX[color] : DIM_HEX[color]}
              rx={3}
            />
          );
        })}

        {/* ── Painted cells — render in the color the bot used ─────────────── */}
        {paintedCells.map(({ col, row, color }) => {
          const key = `${col},${row}`;
          const required = targetMap.get(key);
          const isCorrect = required === color;
          const isExtra   = !required;

          return (
            <g key={`painted-${key}`}>
              {/* Glow halo for correct paints */}
              {isCorrect && (
                <rect
                  x={PADDING + col * CELL_SIZE - 1}
                  y={PADDING + row * CELL_SIZE - 1}
                  width={CELL_SIZE + 2}
                  height={CELL_SIZE + 2}
                  fill={GLOW_HEX[color]}
                  rx={4}
                />
              )}
              {/* The painted fill */}
              <rect
                x={PADDING + col * CELL_SIZE + 1}
                y={PADDING + row * CELL_SIZE + 1}
                width={CELL_SIZE - 2}
                height={CELL_SIZE - 2}
                fill={isExtra ? "#ef4444" : isCorrect ? PAINT_HEX[color] : "#ef4444"}
                opacity={isExtra ? 0.55 : 1}
                rx={3}
              />
              {/* Wrong-color indicator: small ✕ */}
              {!isCorrect && !isExtra && (
                <text
                  x={PADDING + col * CELL_SIZE + CELL_SIZE / 2}
                  y={PADDING + row * CELL_SIZE + CELL_SIZE / 2 + 5}
                  fontSize={14}
                  fill="#ef4444"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  ✕
                </text>
              )}
            </g>
          );
        })}

        {/* ── Grid lines ───────────────────────────────────────────────────── */}
        <g stroke="#2a2e3d" strokeWidth={1}>
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={PADDING + i * CELL_SIZE} y1={PADDING}
              x2={PADDING + i * CELL_SIZE} y2={PADDING + rows * CELL_SIZE}
            />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={PADDING}                   y1={PADDING + i * CELL_SIZE}
              x2={PADDING + cols * CELL_SIZE} y2={PADDING + i * CELL_SIZE}
            />
          ))}
        </g>

        {/* ── Color legend: small dot per color used in this level ─────────── */}
        {(() => {
          const colors = [...new Set(targetCells.map((t) => t.color))];
          return colors.map((c, i) => (
            <g key={`legend-${c}`} transform={`translate(${PADDING + 4 + i * 22}, ${PADDING + 4})`}>
              <circle r={6} fill={PAINT_HEX[c]} opacity={0.85} />
            </g>
          ));
        })()}

        {/* ── Bot ──────────────────────────────────────────────────────────── */}
        <g
          transform={`translate(${botX}, ${botY})`}
          style={{ transition: "transform 0.12s ease-out" }}
        >
          <circle r={14} fill={botColor} opacity={executionState === "running" ? 0.15 : 0.08} />
          <circle r={11} fill={botColor} opacity={0.92} />
          <path d={FACING_ARROWS[bot.facing]} fill="#14161f" />
          {executionState === "success" && (
            <circle r={16} fill="none" stroke="#2fd9c5" strokeWidth={2} opacity={0.8} />
          )}
          {executionState === "error" && (
            <circle r={16} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.8} />
          )}
        </g>

        {/* ── Goal star (center-ish target cell) ───────────────────────────── */}
        {targetCells.length > 0 && executionState !== "success" && (() => {
          const mid = targetCells[Math.floor(targetCells.length / 2)];
          return (
            <text
              x={PADDING + mid.col * CELL_SIZE + CELL_SIZE / 2}
              y={PADDING + mid.row * CELL_SIZE + CELL_SIZE / 2 + 5}
              fontSize={12}
              textAnchor="middle"
              fill="#fff"
              opacity={0.5}
            >
              ★
            </text>
          );
        })()}
      </svg>
    </div>
  );
}
