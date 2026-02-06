"use client";

import { motion } from "framer-motion";
import { SuggestedReply } from "@/src/state/types";

interface SuggestionChipProps {
  suggestion: SuggestedReply;
  onPress: (suggestion: SuggestedReply) => void;
  index: number;
  disabled?: boolean;
}

const typeEmoji: Record<string, string> = {
  objection: "⚡",
  evidence: "📋",
  dramatic: "🔥",
  strategic: "🎯",
  surrender: "🏳️",
};

export function SuggestionChip({ suggestion, onPress, index, disabled }: SuggestionChipProps) {
  const isSurrender = suggestion.variant === "surrender";

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={() => onPress(suggestion)}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shrink-0
                  transition-all duration-150 cursor-pointer select-none
                  hover:brightness-125 active:scale-[0.96]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  max-w-[260px] min-w-[140px]`}
      style={{
        background: isSurrender ? "var(--chip-surrender)" : "var(--chip-default)",
        borderColor: isSurrender ? "#b91c1c" : "var(--chip-border)",
      }}
    >
      <span className="text-base shrink-0">{typeEmoji[suggestion.type] ?? "💬"}</span>
      <span
        className="text-[13px] font-semibold text-left leading-tight"
        style={{ color: isSurrender ? "#fff" : "var(--chip-text)" }}
      >
        {suggestion.text}
      </span>
    </motion.button>
  );
}
