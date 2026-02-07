"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";
import type { LeaderboardEntry } from "@/src/state/types";

type SortKey = "total_score" | "win_rate" | "wins" | "losses";

const TABS: { key: SortKey; label: string }[] = [
  { key: "total_score", label: "Score" },
  { key: "win_rate", label: "Win Rate" },
  { key: "wins", label: "Wins" },
  { key: "losses", label: "Losses" },
];

function sortEntries(entries: LeaderboardEntry[], key: SortKey): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (key === "losses") return b.losses - a.losses || b.total_score - a.total_score;
    return (b[key] as number) - (a[key] as number);
  });
}

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("total_score");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .limit(50);

      if (!error && data) {
        setEntries(data as unknown as LeaderboardEntry[]);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = sortEntries(entries, sortBy);

  // Column label for the active sort metric
  const metricLabel = TABS.find((t) => t.key === sortBy)?.label ?? "Score";

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
          style={{
            borderColor: "var(--chip-border)",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="inline mr-1 -mt-0.5"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
        <h1 className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
          Leaderboard
        </h1>
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-1 px-5 py-3 shrink-0 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            className="px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-150 cursor-pointer whitespace-nowrap"
            style={{
              background:
                sortBy === tab.key ? "var(--primary)" : "var(--bg-light)",
              color: sortBy === tab.key ? "white" : "var(--text-muted)",
              border:
                sortBy === tab.key
                  ? "1px solid var(--primary)"
                  : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--primary)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No players on the board yet.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Play a game to get ranked.
            </p>
          </div>
        ) : (
          <div className="px-5 py-2">
            {/* Column headers */}
            <div
              className="flex items-center gap-3 px-4 pb-3 mb-1"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span
                className="w-8 text-[10px] font-medium tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                #
              </span>
              <span
                className="flex-1 text-[10px] font-medium tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                PLAYER
              </span>
              <span
                className="w-16 text-[10px] font-medium tracking-wider text-right"
                style={{ color: "var(--text-muted)" }}
              >
                W/L
              </span>
              <span
                className="w-20 text-[10px] font-medium tracking-wider text-right"
                style={{
                  color:
                    sortBy === "total_score" || sortBy === "win_rate"
                      ? "var(--accent)"
                      : "var(--text-muted)",
                }}
              >
                {metricLabel.toUpperCase()}
              </span>
            </div>

            {sorted.map((entry, idx) => {
              const isMe = entry.id === currentUserId;
              const metricValue =
                sortBy === "total_score"
                  ? entry.total_score.toLocaleString()
                  : sortBy === "win_rate"
                  ? `${entry.win_rate}%`
                  : sortBy === "wins"
                  ? entry.wins.toString()
                  : entry.losses.toString();

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all"
                  style={{
                    background: isMe
                      ? "rgba(255,56,92,0.08)"
                      : idx < 3
                      ? "rgba(224,185,122,0.04)"
                      : "transparent",
                  }}
                >
                  <span
                    className="w-8 text-sm font-semibold tabular-nums"
                    style={{
                      color: idx < 3 ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="flex-1 text-sm font-medium truncate"
                    style={{
                      color: isMe
                        ? "var(--primary)"
                        : "var(--text-primary)",
                    }}
                  >
                    {entry.display_name}
                    {isMe && (
                      <span
                        className="text-[10px] ml-1.5 font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        (you)
                      </span>
                    )}
                  </span>
                  <span
                    className="w-16 text-sm tabular-nums text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {entry.wins}/{entry.losses}
                  </span>
                  <span
                    className="w-20 text-sm font-semibold tabular-nums text-right"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {metricValue}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
