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
      {/* Tab bar */}
      <div className="flex gap-1 px-4 mb-3">
        {(["recent", "starred"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase
                       transition-all duration-150 cursor-pointer"
            style={{
              background: tab === t ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t === "recent" ? "Recent" : "⭐ Starred"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-2"
            >
              <span className="text-3xl">⚖️</span>
              <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                {tab === "starred"
                  ? "No starred arguments yet."
                  : "No arguments yet. Enter the courtroom to begin."}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
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
