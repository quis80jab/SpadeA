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
  won: { label: "WON", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  lost: { label: "LOST", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  "in-progress": { label: "IN PROGRESS", color: "#eab308", bg: "rgba(234,179,8,0.15)" },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ArgumentCard({ argument, onView, onToggleStar, index }: ArgumentCardProps) {
  const badge = outcomeBadge[argument.outcome] ?? outcomeBadge["in-progress"];
  const healthPct = Math.round(
    argument.outcome === "won"
      ? (argument.finalHealth.defendantHP / argument.finalHealth.maxHP) * 100
      : argument.outcome === "lost"
      ? (argument.finalHealth.attorneyHP / argument.finalHealth.maxHP) * 100
      : 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-xl p-4 cursor-pointer transition-all duration-150 hover:brightness-125 active:scale-[0.98]"
      style={{
        background: "var(--bg-light)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onClick={() => onView(argument.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{argument.caseData.title}</h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            {argument.caseData.charge}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(argument.id);
          }}
          className="text-lg shrink-0 cursor-pointer p-1 -m-1"
          title={argument.starred ? "Unstar" : "Star"}
        >
          {argument.starred ? "⭐" : "☆"}
        </button>
      </div>

      <div className="flex items-center gap-3 mt-2.5">
        <span
          className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: badge.color, background: badge.bg }}
        >
          {badge.label}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {argument.exchangeCount} exchanges
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {formatDate(argument.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
