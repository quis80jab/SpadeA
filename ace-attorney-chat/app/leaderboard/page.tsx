"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";
import type { LeaderboardEntry } from "@/src/state/types";

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => router.push("/")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 className="text-sm font-medium text-white flex-1">Leaderboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No players on the board yet.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Play a game to get ranked.</p>
          </div>
        ) : (
          <div className="px-5 py-4">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 pb-3 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="w-8 text-[10px] font-medium tracking-wider" style={{ color: "var(--text-muted)" }}>#</span>
              <span className="flex-1 text-[10px] font-medium tracking-wider" style={{ color: "var(--text-muted)" }}>PLAYER</span>
              <span className="w-16 text-[10px] font-medium tracking-wider text-right" style={{ color: "var(--text-muted)" }}>W/L</span>
              <span className="w-14 text-[10px] font-medium tracking-wider text-right" style={{ color: "var(--text-muted)" }}>RATE</span>
              <span className="w-16 text-[10px] font-medium tracking-wider text-right" style={{ color: "var(--text-muted)" }}>SCORE</span>
            </div>

            {entries.map((entry, idx) => {
              const isMe = entry.id === currentUserId;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all"
                  style={{
                    background: isMe ? "rgba(255,56,92,0.08)" : idx < 3 ? "rgba(224,185,122,0.04)" : "transparent",
                  }}
                >
                  <span
                    className="w-8 text-sm font-semibold tabular-nums"
                    style={{ color: idx < 3 ? "var(--accent)" : "var(--text-muted)" }}
                  >
                    {entry.rank}
                  </span>
                  <span
                    className="flex-1 text-sm font-medium truncate"
                    style={{ color: isMe ? "var(--primary)" : "var(--text-primary)" }}
                  >
                    {entry.display_name}
                    {isMe && (
                      <span className="text-[10px] ml-1.5 font-normal" style={{ color: "var(--text-muted)" }}>(you)</span>
                    )}
                  </span>
                  <span className="w-16 text-sm tabular-nums text-right" style={{ color: "var(--text-secondary)" }}>
                    {entry.wins}/{entry.losses}
                  </span>
                  <span className="w-14 text-sm tabular-nums text-right" style={{ color: "var(--text-secondary)" }}>
                    {entry.win_rate}%
                  </span>
                  <span className="w-16 text-sm font-semibold tabular-nums text-right" style={{ color: "var(--text-primary)" }}>
                    {entry.total_score.toLocaleString()}
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
