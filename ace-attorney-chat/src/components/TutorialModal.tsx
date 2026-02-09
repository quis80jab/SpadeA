"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialModalProps {
  open: boolean;
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="32" height="38" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M16 16h16M16 22h12M16 28h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="10" r="8" fill="var(--primary)" />
        <path d="M33 10l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "You\u2019ve Been Accused",
    description:
      "You stand accused of absurd crimes. Your job: argue your way to freedom against a ruthless AI prosecutor.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="12" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <rect x="16" y="8" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" fill="var(--bg-card)" />
        <rect x="28" y="12" width="16" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <path d="M22 16h4M22 20h4M22 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="20" r="3" fill="var(--primary)" />
      </svg>
    ),
    title: "Choose Your Evidence",
    description:
      "Before trial, pick 3 evidence cards. Deploy them mid-argument to deal massive damage \u2014 but choose wisely, you can\u2019t take them all.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 24h8M30 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="20" r="2" fill="var(--primary)" />
        <circle cx="34" cy="20" r="2" fill="var(--accent)" />
        <path d="M20 30c0-2 2-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Argue to Survive",
    description:
      "Each round, pick a suggested response or type your own. Strong logic and evidence deal more damage. Weak arguments? The attorney hits back harder.",
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="30" width="36" height="6" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="7" y="31" width="20" height="4" rx="2" fill="var(--take-that)" opacity="0.8" />
        <rect x="6" y="20" width="36" height="6" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="7" y="21" width="28" height="4" rx="2" fill="var(--primary)" opacity="0.8" />
        <path d="M24 6l3 5h-6l3-5z" fill="currentColor" />
        <path d="M20 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Win or Lose",
    description:
      "Drain the attorney\u2019s health bar to zero and you\u2019re acquitted. Let yours hit zero and you\u2019re found guilty. Good luck, counselor.",
  },
];

export function TutorialModal({ open, onComplete }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  const handleNext = useCallback(() => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const slide = SLIDES[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mx-4 w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
          >
            {/* Content */}
            <div className="px-6 pt-8 pb-4">
              {/* Skip button */}
              <div className="flex justify-end mb-4">
                {step < SLIDES.length - 1 && (
                  <button
                    onClick={handleSkip}
                    className="text-xs cursor-pointer transition-all duration-150"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Skip
                  </button>
                )}
              </div>

              {/* Icon + Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
                  >
                    {slide.icon}
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {slide.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots + Button */}
            <div className="px-6 pb-6 pt-4">
              {/* Dots */}
              <div className="flex justify-center gap-2 mb-5">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === step ? 20 : 6,
                      background:
                        i === step ? "var(--primary)" : "var(--border-subtle)",
                    }}
                  />
                ))}
              </div>

              {/* Action button */}
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer
                           transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{ background: "var(--primary)" }}
              >
                {step < SLIDES.length - 1 ? "Next" : "Got it, let\u2019s go"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
