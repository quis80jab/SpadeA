"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="self-start px-4 my-1 max-w-[70%]"
    >
      <span
        className="text-[10px] font-bold tracking-wider block mb-1"
        style={{ color: "var(--primary)" }}
      >
        ⚔️ PROSECUTOR
      </span>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 border border-[rgba(232,213,255,0.1)]"
        style={{ background: "var(--attorney-bubble)" }}
      >
        <div className="flex gap-1.5 mb-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--attorney-text)" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
          Preparing argument...
        </p>
      </div>
    </motion.div>
  );
}
