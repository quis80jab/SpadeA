"use client";

import { motion } from "framer-motion";
import type { SavedArgument } from "@/src/state/types";

interface ArgumentCardProps {
  argument: SavedArgument;
  onView: (id: string) => void;
  onToggleStar: (id: string) => void;
  index: number;
}

const outcomeBadge: Record<string, { label: string; color: string; bg: string }> = {
  won: { label: "Won", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  lost: { label: "Lost", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  "in-progress": { label: "In Progress", color: "#E0B97A", bg: "rgba(224,185,122,0.12)" },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ArgumentCard({ argument, onView, onToggleStar, index }: ArgumentCardProps) {
  const badge = outcomeBadge[argument.outcome] ?? outcomeBadge["in-progress"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-2xl p-5 cursor-pointer transition-all duration-150 hover:brightness-[0.97] active:scale-[0.99]"
      style={{
        background: "var(--bg-light)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
      onClick={() => onView(argument.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{argument.caseData.title}</h3>
          <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
            {argument.caseData.charge}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(argument.id);
          }}
          className="shrink-0 cursor-pointer p-1.5 -m-1 rounded-full transition-all duration-150 hover:bg-[var(--hover-overlay)]"
          title={argument.starred ? "Unstar" : "Star"}
        >
          {argument.starred ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#E0B97A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717171" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <span
          className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full"
          style={{ color: badge.color, background: badge.bg }}
        >
          {badge.label}
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {argument.exchangeCount} exchanges
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {formatDate(argument.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
