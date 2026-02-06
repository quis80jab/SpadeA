"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="self-start px-5 my-1.5 max-w-[70%]"
    >
      <span
        className="text-[10px] font-medium tracking-wider block mb-1"
        style={{ color: "var(--primary)" }}
      >
        PROSECUTION
      </span>
      <div
        className="rounded-2xl rounded-tl-md px-4 py-3.5"
        style={{ background: "var(--attorney-bubble)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      >
        <div className="flex gap-1.5 mb-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--attorney-text)" }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Preparing argument...
        </p>
      </div>
    </motion.div>
  );
}
