"use client";

import { motion } from "framer-motion";
import { SuggestedReply } from "@/src/state/types";

interface SuggestionChipProps {
  suggestion: SuggestedReply;
  onPress: (suggestion: SuggestedReply) => void;
  index: number;
  disabled?: boolean;
}

const typeDot: Record<string, string> = {
  objection: "#FF385C",
  evidence: "#34D399",
  dramatic: "#E0B97A",
  strategic: "#60A5FA",
  surrender: "#DC2626",
};

export function SuggestionChip({ suggestion, onPress, index, disabled }: SuggestionChipProps) {
  const isSurrender = suggestion.variant === "surrender";

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      onClick={() => onPress(suggestion)}
      disabled={disabled}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shrink-0
                  transition-all duration-150 cursor-pointer select-none
                  hover:bg-white/5 active:scale-[0.97]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  max-w-[280px] min-w-[140px]`}
      style={{
        background: isSurrender ? "var(--chip-surrender)" : "var(--chip-default)",
        borderColor: isSurrender ? "#991b1b" : "var(--chip-border)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: typeDot[suggestion.type] ?? "#717171" }}
      />
      <span
        className="text-[13px] font-medium text-left leading-snug"
        style={{ color: isSurrender ? "#fff" : "var(--chip-text)" }}
      >
        {suggestion.text}
      </span>
    </motion.button>
  );
}
