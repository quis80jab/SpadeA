"use client";

import { motion } from "framer-motion";

/**
 * Animated books & papers stacking into a pile.
 * Shown during case generation on the splash page.
 */

const ITEMS = [
  {
    // Paper with folded corner
    element: (
      <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
        <path d="M2 4a2 2 0 012-2h24l10 10v32a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.5" />
        <path d="M28 2v8a2 2 0 002 2h8" stroke="var(--text-muted)" strokeWidth="1.5" />
        <path d="M10 20h20M10 26h16M10 32h18" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    rotation: -6,
  },
  {
    // Book with spine
    element: (
      <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
        <rect x="2" y="2" width="40" height="32" rx="2" fill="var(--primary)" opacity="0.15" stroke="var(--primary)" strokeWidth="1.5" />
        <line x1="10" y1="2" x2="10" y2="34" stroke="var(--primary)" strokeWidth="1.5" />
        <path d="M16 12h18M16 18h14" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    rotation: 4,
  },
  {
    // Folder
    element: (
      <svg width="44" height="38" viewBox="0 0 44 38" fill="none">
        <path d="M2 8a2 2 0 012-2h12l4 4h20a2 2 0 012 2v22a2 2 0 01-2 2H4a2 2 0 01-2-2V8z" fill="var(--accent)" opacity="0.12" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M2 14h40" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    rotation: -3,
  },
  {
    // Another paper
    element: (
      <svg width="38" height="46" viewBox="0 0 38 46" fill="none">
        <rect x="2" y="2" width="34" height="42" rx="2" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.5" />
        <path d="M10 14h18M10 20h14M10 26h16M10 32h10" stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="30" cy="10" r="4" fill="var(--primary)" opacity="0.3" />
      </svg>
    ),
    rotation: 7,
  },
  {
    // Gavel
    element: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <rect x="14" y="4" width="14" height="8" rx="2" fill="var(--text-muted)" opacity="0.3" stroke="var(--text-muted)" strokeWidth="1.5" />
        <line x1="21" y1="12" x2="21" y2="30" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="21" cy="34" rx="12" ry="3" fill="var(--text-muted)" opacity="0.15" />
        <rect x="12" y="30" width="18" height="4" rx="1" fill="var(--text-muted)" opacity="0.3" stroke="var(--text-muted)" strokeWidth="1" />
      </svg>
    ),
    rotation: -2,
  },
];

export function CaseLoadingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Pile area */}
      <div className="relative w-32 h-28 flex items-end justify-center">
        {ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              bottom: i * 4,
              zIndex: i,
            }}
            initial={{ opacity: 0, y: -60, rotate: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: item.rotation,
            }}
            transition={{
              delay: i * 0.35,
              duration: 0.5,
              type: "spring",
              damping: 12,
              stiffness: 120,
              repeat: Infinity,
              repeatDelay: ITEMS.length * 0.35 + 1.5,
            }}
          >
            {item.element}
          </motion.div>
        ))}
      </div>

      {/* Text with pulse */}
      <motion.p
        className="text-sm"
        style={{ color: "var(--text-secondary)" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Preparing your case...
      </motion.p>
    </div>
  );
}
