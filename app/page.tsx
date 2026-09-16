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
  const [pendingRedirect, setPendingRedirect] = useState<string>("/play/1");
  const [isResuming, setIsResuming] = useState(false);

  // ── Resume an existing session ──────────────────────────────────────────────
  const handleResume = async () => {
    if (!usn.trim()) {
      setError("Please enter your USN to resume.");
      return;
    }
    setLoading(true);
    setError("");
    setIsResuming(true);

    try {
      const res = await fetch("/api/session/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: usn.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not resume session.");
        setLoading(false);
        setIsResuming(false);
        return;
      }

      // Restore session in sessionStorage exactly like fresh login
      sessionStorage.setItem(
        "compile_session",
        JSON.stringify({
          sessionId: data.sessionId,
          name: data.name,
          rollNumber: data.rollNumber,
          startedAt: data.startedAt,
          // Preserve the original start time so the timer stays accurate
          startedAtMs: new Date(data.startedAt).getTime(),
        })
      );

      const target = `/play/${data.nextLevel}`;
      setLoading(false);
      router.push(target);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
      setIsResuming(false);
    }
  };

  // ── Start a fresh session ───────────────────────────────────────────────────
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
        // USN already registered → offer resume automatically
        if (res.status === 409) {
          setLoading(false);
          setError(
            `USN ${usn.trim()} is already registered. Click "Resume Session" below to continue from where you left off.`
          );
          return;
        }
        setError(data.error ?? "Failed to start session.");
        setLoading(false);
        return;
      }

      // Store session
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

      // Show how-to-play guide, then redirect
      setLoading(false);
      setPendingRedirect("/play/1");
      setShowHowToPlay(true);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  const handleHowToPlayClose = () => {
    setShowHowToPlay(false);
    router.push(pendingRedirect);
  };

  // Detect if USN already registered to show Resume button prominently
  const showResumeButton =
    error.includes("already registered") || error.includes("already exists");

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
                onChange={(e) => {
                  setUsn(e.target.value.toUpperCase());
                  // Clear resume-related errors when user edits USN
                  if (showResumeButton) setError("");
                }}
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {error && (
              <p className={`form-error${showResumeButton ? " form-error--info" : ""}`}>
                {error}
              </p>
            )}

            {/* Resume button — shown prominently when USN is already registered */}
            {showResumeButton ? (
              <button
                id="btn-resume"
                className="btn-start btn-start--resume"
                type="button"
                onClick={handleResume}
                disabled={loading}
              >
                {loading && isResuming ? (
                  <span className="btn-start__spinner" />
                ) : (
                  <>
                    <span>Resume Session →</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="btn-start"
                className="btn-start"
                type="submit"
                disabled={loading}
              >
                {loading && !isResuming ? (
                  <span className="btn-start__spinner" />
                ) : (
                  <>
                    <span>Start Contest</span>
                    <span className="btn-start__arrow">→</span>
                  </>
                )}
              </button>
            )}

            {/* Always-visible resume hint */}
            {!showResumeButton && (
              <p className="landing__resume-hint">
                Returning?{" "}
                <button
                  type="button"
                  className="landing__resume-link"
                  onClick={handleResume}
                  disabled={loading}
                >
                  Enter your USN above and click here to resume
                </button>
              </p>
            )}
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
