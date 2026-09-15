"use client";

import React, { useEffect, useState } from "react";

interface TopBarProps {
  levelId: number;
  levelCount: number;
  levelTitle: string;
  goalText: string;
  startedAt: number;        // unix ms (client-side)
  durationMs: number;       // e.g. 90 * 60 * 1000
  totalBlocks: number;
  blockBudget: number | null;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TopBar({
  levelId,
  levelCount,
  levelTitle,
  goalText,
  startedAt,
  durationMs,
  totalBlocks,
  blockBudget,
}: TopBarProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setRemaining(Math.max(0, durationMs - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMs]);

  const pct = Math.min(1, remaining / durationMs);
  const urgentColor = remaining < 5 * 60 * 1000 ? "#ef4444" : undefined;

  return (
    <header className="topbar">
      <div className="topbar__left">
        <span className="topbar__level">Level {levelId} of {levelCount}</span>
        <span className="topbar__title">{levelTitle}</span>
        <span className="topbar__goal">{goalText}</span>
      </div>

      <div className="topbar__right">
        {/* Timer */}
        <div className="topbar__timer-group">
          <div className="topbar__timer-bar-wrap">
            <div
              className="topbar__timer-bar"
              style={{
                width: `${pct * 100}%`,
                background: urgentColor
                  ? urgentColor
                  : "linear-gradient(90deg, #2fd9c5, #8b7cf0)",
              }}
            />
          </div>
          <span
            className="topbar__timer-label"
            style={{ color: urgentColor ?? "var(--color-muted)" }}
          >
            {formatTime(remaining)} left
          </span>
        </div>

        {/* Blocks used */}
        <span className="topbar__blocks">
          Blocks used:{" "}
          <strong
            style={{
              color:
                blockBudget !== null && totalBlocks > blockBudget
                  ? "#ef4444"
                  : "var(--color-text)",
            }}
          >
            {totalBlocks}
          </strong>
          {blockBudget !== null && ` / ${blockBudget}`}
        </span>
      </div>
    </header>
  );
}
