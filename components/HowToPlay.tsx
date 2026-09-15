"use client";

import React, { useState } from "react";

interface HowToPlayProps {
  trigger?: "icon"; // when used as floating i-button
  autoOpen?: boolean;
  onClose?: () => void;
}

const STEPS = [
  {
    icon: "🎯",
    title: "Your mission",
    body: "Each level shows a grid with amber-highlighted cells. Your job is to write a program that makes the bot paint exactly those cells — no more, no less.",
  },
  {
    icon: "🤖",
    title: "Meet your bot",
    body: "The white circle on the grid is your bot. It starts facing a direction (the arrow shows which way). Your program controls every move it makes.",
  },
  {
    icon: "🧱",
    title: "Command blocks",
    body: "Drag or click blocks from the right panel into the program track at the bottom. Each block is one instruction:",
    list: [
      "↑  Move Forward — advances one cell in the direction the bot faces",
      "↶  Turn Left — rotates the bot 90° counter-clockwise (doesn't move)",
      "↷  Turn Right — rotates the bot 90° clockwise (doesn't move)",
      "■  Paint — fills the current cell the bot is standing on",
    ],
  },
  {
    icon: "🔁",
    title: "Loops (Level 3+)",
    body: "The ×N block repeats the next few blocks N times. Click ✏ on a loop block to set the repeat count (2–10). This is how you avoid writing the same steps over and over.",
  },
  {
    icon: "⚙️",
    title: "Functions P1 / P2 / P3 (Level 5+)",
    body: "Functions let you define a mini-program once and call it many times. Click the + button next to a function color to define its steps, then drop P1/P2/P3 anywhere in your main program to run it.",
  },
  {
    icon: "💡",
    title: "Block budget (Level 9+)",
    body: "Later levels limit how many blocks you can use. The counter in the top-right turns red if you go over. You must compress your solution using loops and functions — brute force won't work!",
  },
  {
    icon: "▶",
    title: "Running your program",
    body: "Click the teal ▶ button to run. The bot will animate step by step. A green banner means you solved it — you'll automatically move to the next level. A red banner means something went wrong — reset and try again!",
  },
  {
    icon: "🏆",
    title: "Winning",
    body: "The student who completes all 10 levels the fastest wins. Ties are broken by fewest total blocks used across all levels — so think smart, not just fast!",
  },
];

export default function HowToPlay({ trigger, autoOpen = false, onClose }: HowToPlayProps) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState(0);

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    onClose?.();
  };

  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* i-button trigger */}
      {trigger === "icon" && (
        <button
          className="htp-trigger"
          title="How to play"
          onClick={() => { setOpen(true); setStep(0); }}
          aria-label="How to play"
        >
          i
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="htp-overlay" onClick={handleClose}>
          <div
            className="htp-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="How to play"
          >
            {/* Header */}
            <div className="htp-header">
              <div className="htp-header-left">
                <span className="htp-logo">{"</>"}</span>
                <span className="htp-title">How to Play</span>
              </div>
              <button className="htp-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            {/* Step dots */}
            <div className="htp-dots">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  className={`htp-dot ${i === step ? "htp-dot--active" : i < step ? "htp-dot--done" : ""}`}
                  onClick={() => setStep(i)}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="htp-step">
              <div className="htp-step-icon">{STEPS[step].icon}</div>
              <h2 className="htp-step-title">{STEPS[step].title}</h2>
              <p className="htp-step-body">{STEPS[step].body}</p>
              {STEPS[step].list && (
                <ul className="htp-step-list">
                  {STEPS[step].list!.map((item, i) => (
                    <li key={i} className="htp-step-list-item">
                      <span className="htp-step-list-icon">{item.split("  ")[0]}</span>
                      <span>{item.split("  ").slice(1).join("  ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer navigation */}
            <div className="htp-footer">
              <button
                className="htp-btn htp-btn--secondary"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                ← Back
              </button>

              <span className="htp-step-count">{step + 1} / {STEPS.length}</span>

              {isLast ? (
                <button className="htp-btn htp-btn--primary" onClick={handleClose}>
                  Let's go! 🚀
                </button>
              ) : (
                <button className="htp-btn htp-btn--primary" onClick={() => setStep((s) => s + 1)}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
