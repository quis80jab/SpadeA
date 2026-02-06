"use client";

import { motion } from "framer-motion";
import { Message } from "@/src/state/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAttorney = message.sender === "attorney";
  const intensity = message.intensity ?? 1;

  const scale = intensity >= 4 ? 1 + (intensity - 4) * 0.008 : 1;

  return (
    <motion.div
      initial={
        isAttorney
          ? intensity >= 7
            ? { opacity: 0, scale: 0.9 }
            : { opacity: 0, x: -20 }
          : { opacity: 0, x: 20 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: intensity >= 7 ? 0.4 : 0.3,
        type: intensity >= 7 ? "spring" : "tween",
      }}
      className={`flex flex-col max-w-[82%] my-1.5 px-5 ${
        isAttorney ? "self-start" : "self-end"
      }`}
    >
      <span
        className={`text-[10px] font-medium tracking-wider mb-1 ${
          isAttorney ? "text-left" : "text-right"
        }`}
        style={{ color: isAttorney ? "var(--primary)" : "var(--accent)" }}
      >
        {isAttorney ? "PROSECUTION" : "YOU"}
      </span>

      <div
        className={`rounded-2xl px-4 py-3.5 ${
          isAttorney ? "rounded-tl-md" : "rounded-tr-md"
        }`}
        style={{
          background: isAttorney ? "var(--attorney-bubble)" : "var(--user-bubble)",
          transform: `scale(${scale})`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
