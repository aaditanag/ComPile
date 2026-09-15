"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HowToPlay from "@/components/HowToPlay";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !usn.trim()) {
      setError("Please enter both your name and USN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rollNumber: usn.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start session.");
        setLoading(false);
        return;
      }

      // Store session in sessionStorage
      sessionStorage.setItem(
        "compile_session",
        JSON.stringify({
          sessionId: data.sessionId,
          name: data.name,
          rollNumber: data.rollNumber,
          startedAt: data.startedAt,
          startedAtMs: Date.now(),
        })
      );

      // Show the how-to-play guide first, then redirect
      setLoading(false);
      setPendingRedirect(true);
      setShowHowToPlay(true);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  const handleHowToPlayClose = () => {
    setShowHowToPlay(false);
    if (pendingRedirect) {
      router.push("/play/1");
    }
  };

  return (
    <>
      <main className="landing">
        {/* Background decoration */}
        <div className="landing__bg-grid" aria-hidden />
        <div className="landing__glow landing__glow--purple" aria-hidden />
        <div className="landing__glow landing__glow--teal" aria-hidden />

        <div className="landing__card">
          {/* Logo */}
          <div className="landing__logo-wrap">
            <span className="landing__logo-icon">{"</>"}</span>
            <h1 className="landing__logo-text">
              <span className="gradient-purple">Com</span>
              <span className="gradient-teal">pile</span>
            </h1>
          </div>

          <p className="landing__tagline">
            A visual-programming puzzle contest
          </p>
          <p className="landing__subtitle">
            Stack command blocks, guide your bot, trace target shapes.
            <br />
            10 levels · 90 minutes · fastest solver wins.
          </p>

          <form className="landing__form" onSubmit={handleStart}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input
                id="name"
                className="form-input"
                type="text"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="usn" className="form-label">USN</label>
              <input
                id="usn"
                className="form-input"
                type="text"
                placeholder="e.g. 1VA2XXXXXX"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              id="btn-start"
              className="btn-start"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-start__spinner" />
              ) : (
                <>
                  <span>Start Contest</span>
                  <span className="btn-start__arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Info strip */}
          <div className="landing__info">
            <div className="info-chip">
              <span className="info-chip__icon">🏆</span>
              Fastest finish wins
            </div>
            <div className="info-chip">
              <span className="info-chip__icon">⏱</span>
              90-min timer
            </div>
            <div className="info-chip">
              <span className="info-chip__icon">🎮</span>
              10 levels
            </div>
          </div>
        </div>

        {/* Leaderboard link */}
        <a href="/leaderboard" className="landing__lb-link">
          View Leaderboard →
        </a>
      </main>

      {/* How to Play modal — auto-opens after successful login */}
      {showHowToPlay && (
        <HowToPlay autoOpen onClose={handleHowToPlayClose} />
      )}
    </>
  );
}
