"use client";

import { motion } from "framer-motion";
import { Message } from "@/src/state/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAttorney = message.sender === "attorney";
  const intensity = message.intensity ?? 1;

  const scale = intensity >= 4 ? 1 + (intensity - 4) * 0.01 : 1;

  return (
    <motion.div
      initial={
        isAttorney
          ? intensity >= 7
            ? { opacity: 0, scale: 0.8 }
            : { opacity: 0, x: -30 }
          : { opacity: 0, x: 30 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: intensity >= 7 ? 0.4 : 0.3,
        type: intensity >= 7 ? "spring" : "tween",
      }}
      className={`flex flex-col max-w-[85%] my-1 px-4 ${
        isAttorney ? "self-start" : "self-end"
      }`}
    >
      <span
        className={`text-[10px] font-bold tracking-wider mb-1 ${
          isAttorney ? "text-left" : "text-right"
        }`}
        style={{ color: isAttorney ? "var(--primary)" : "var(--accent)" }}
      >
        {isAttorney ? "⚔️ PROSECUTOR" : "🛡️ YOU"}
      </span>

      <div
        className={`rounded-2xl px-4 py-3 border ${
          isAttorney
            ? "rounded-tl-sm border-[rgba(232,213,255,0.1)]"
            : "rounded-tr-sm border-[rgba(213,234,255,0.1)]"
        }`}
        style={{
          background: isAttorney ? "var(--attorney-bubble)" : "var(--user-bubble)",
          transform: `scale(${scale})`,
        }}
      >
        <p
          className="text-[15px] leading-relaxed whitespace-pre-wrap"
          style={{ color: isAttorney ? "var(--attorney-text)" : "var(--user-text)" }}
        >
          {message.text}
        </p>
      </div>
    </motion.div>
  );
}
