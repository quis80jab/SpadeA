"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SuggestionChip } from "./SuggestionChip";
import { SuggestedReply } from "@/src/state/types";

interface SuggestionCarouselProps {
  suggestions: SuggestedReply[];
  onSelect: (suggestion: SuggestedReply) => void;
  isLoading: boolean;
  disabled?: boolean;
}

function SkeletonChip({ index }: { index: number }) {
  return (
    <div
      className="w-[180px] h-[48px] rounded-xl border shrink-0 p-4 flex flex-col justify-center gap-1.5 skeleton-shimmer"
      style={{
        background: "var(--chip-default)",
        borderColor: "var(--chip-border)",
        animationDelay: `${index * 0.15}s`,
      }}
    >
      <div className="h-2 rounded-full bg-white/[0.04] w-4/5" />
      <div className="h-2 rounded-full bg-white/[0.04] w-3/5" />
    </div>
  );
}

export function SuggestionCarousel({
  suggestions,
  onSelect,
  isLoading,
  disabled,
}: SuggestionCarouselProps) {
  if (isLoading) {
    return (
      <div className="py-2">
        <p
          className="text-[11px] font-medium tracking-wider uppercase px-5 mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          Preparing your options...
        </p>
        <div className="flex gap-2.5 px-5 overflow-x-auto hide-scrollbar">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonChip key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="py-2"
    >
      <p
        className="text-[11px] font-medium tracking-wider uppercase px-5 mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        Your response
      </p>
      <div className="flex gap-2.5 px-5 overflow-x-auto hide-scrollbar pb-1">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, idx) => (
            <SuggestionChip
              key={`${suggestion.text}-${idx}`}
              suggestion={suggestion}
              onPress={onSelect}
              index={idx}
              disabled={disabled}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
