"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHistoryStore } from "@/src/state/historyStore";
import { ArgumentCard } from "./ArgumentCard";

interface ConversationHistoryProps {
  onViewArgument: (id: string) => void;
}

export function ConversationHistory({ onViewArgument }: ConversationHistoryProps) {
  const [tab, setTab] = useState<"recent" | "starred">("recent");
  const { arguments: args, toggleStar, hydrate } = useHistoryStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filtered =
    tab === "starred" ? args.filter((a) => a.starred) : args;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab bar — Airbnb underline style */}
      <div className="flex gap-6 px-8 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["recent", "starred"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative pb-2.5 text-xs font-medium tracking-wider uppercase
                       transition-colors duration-150 cursor-pointer"
            style={{
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t === "recent" ? "Recent" : "Starred"}
            {tab === t && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: "var(--text-primary)" }}
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <span className="text-2xl" style={{ color: "var(--text-muted)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/></svg>
              </span>
              <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                {tab === "starred"
                  ? "No starred arguments yet."
                  : "No arguments yet. Enter the courtroom to begin."}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((arg, idx) => (
                <ArgumentCard
                  key={arg.id}
                  argument={arg}
                  onView={onViewArgument}
                  onToggleStar={toggleStar}
                  index={idx}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
