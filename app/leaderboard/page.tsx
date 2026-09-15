"use client";

import React, { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";

function formatTime(totalSec: number | null): string {
  if (totalSec === null) return "—";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setLastUpdated(new Date());
    } catch {
      // keep old data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  const finished = entries.filter((e) => e.finishedAt);
  const inProgress = entries.filter((e) => !e.finishedAt);

  return (
    <main className="lb-page">
      {/* Background decoration */}
      <div className="landing__bg-grid" aria-hidden />
      <div className="landing__glow landing__glow--purple" aria-hidden />
      <div className="landing__glow landing__glow--teal" aria-hidden />

      <header className="lb-header">
        <a href="/" className="lb-back">← Back</a>
        <h1 className="lb-title">
          <span className="gradient-purple">Leader</span>
          <span className="gradient-teal">board</span>
        </h1>
        {lastUpdated && (
          <span className="lb-updated">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </header>

      {loading && entries.length === 0 ? (
        <div className="lb-loading">Loading results…</div>
      ) : entries.length === 0 ? (
        <div className="lb-empty">
          <p>No finishers yet — contest in progress!</p>
          <p className="lb-empty__sub">Leaderboard refreshes every 5 seconds.</p>
        </div>
      ) : (
        <>
          {/* Podium (top 3 finishers) */}
          {finished.length > 0 && (
            <div className="lb-podium">
              {finished.slice(0, 3).map((e, i) => (
                <div key={e.rollNumber} className={`podium-card podium-card--${i + 1}`}>
                  <span className="podium-medal">{MEDAL[i]}</span>
                  <span className="podium-name">{e.name}</span>
                  <span className="podium-roll">{e.rollNumber}</span>
                  <span className="podium-time">{formatTime(e.totalSeconds)}</span>
                  <span className="podium-blocks">{e.totalBlocksUsed} blocks</span>
                </div>
              ))}
            </div>
          )}

          {/* Full table */}
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>USN</th>
                  <th>Levels Done</th>
                  <th>Time ↑</th>
                  <th title="Total blocks used across all 10 levels — tiebreaker if finish times are equal">Blocks (tie)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.rollNumber}
                    className={e.finishedAt ? "lb-row--finished" : "lb-row--progress"}
                  >
                    <td className="lb-rank">
                      {e.finishedAt
                        ? (MEDAL[e.rank - 1] ?? e.rank)
                        : "—"}
                    </td>
                    <td className="lb-name">{e.name}</td>
                    <td className="lb-roll">{e.rollNumber}</td>
                    <td className="lb-levels">{e.levelsCompleted} / 10</td>
                    <td className="lb-time">
                      {e.finishedAt ? formatTime(e.totalSeconds) : "—"}
                    </td>
                    <td className="lb-blocks">{e.totalBlocksUsed}</td>
                    <td>
                      {e.finishedAt ? (
                        <span className="lb-badge lb-badge--done">Finished</span>
                      ) : (
                        <span className="lb-badge lb-badge--live">
                          ● Level {e.levelsCompleted + 1}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
