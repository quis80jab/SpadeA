"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";
import type { UserProfile, SavedArgument } from "@/src/state/types";

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const outcomeBadge: Record<string, { label: string; color: string; bg: string }> = {
  won: { label: "Won", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  lost: { label: "Lost", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [args, setArgs] = useState<SavedArgument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as unknown as UserProfile);

      const { data: argsData } = await supabase
        .from("arguments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (argsData) {
        setArgs(
          argsData.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            user_id: row.user_id as string,
            caseData: row.case_data as SavedArgument["caseData"],
            messages: row.messages as SavedArgument["messages"],
            outcome: row.outcome as SavedArgument["outcome"],
            finalHealth: row.final_health as SavedArgument["finalHealth"],
            exchangeCount: row.exchange_count as number,
            score: (row.score as number) ?? 0,
            starred: row.starred as boolean,
            is_public: row.is_public as boolean,
            createdAt: new Date(row.created_at as string).getTime(),
          }))
        );
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) return null;

  const winRate = (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0" style={{ borderBottom: `1px solid var(--border-subtle)` }}>
        <button
          onClick={() => router.push("/")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>Profile</h1>
        <button
          onClick={() => router.push("/settings")}
          className="text-xs px-3.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-8 pb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold overflow-hidden"
              style={{ background: "var(--bg-card)", color: "var(--primary)" }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{profile.display_name}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Joined {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Score", value: profile.total_score.toLocaleString() },
              { label: "Wins", value: profile.wins.toString() },
              { label: "Losses", value: profile.losses.toString() },
              { label: "Win Rate", value: `${winRate}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center"
                style={{ background: "var(--bg-light)" }}
              >
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="px-6 pb-2">
          <div className="h-px" style={{ background: "var(--border-subtle)" }} />
        </div>

        {/* Arguments list */}
        <div className="px-6 pb-6">
          <h3 className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "var(--text-muted)" }}>
            Recent Arguments
          </h3>
          {args.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
              No arguments yet. Enter the courtroom to begin.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {args.map((arg, idx) => {
                const badge = outcomeBadge[arg.outcome] ?? outcomeBadge["lost"];
                return (
                  <motion.div
                    key={arg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:brightness-[0.97]"
                    style={{ background: "var(--bg-light)" }}
                    onClick={() => router.push(`/argument/${arg.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{arg.caseData.title}</p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {arg.exchangeCount} rounds &middot; +{arg.score} pts
                        {arg.is_public && " \u00B7 Public"}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: badge.color, background: badge.bg }}
                    >
                      {badge.label}
                    </span>
                    {arg.is_public && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/a/${arg.id}`);
                        }}
                        className="text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:brightness-95 transition-all shrink-0"
                        style={{ borderColor: "var(--chip-border)", color: "var(--text-muted)" }}
                        title="Copy share link"
                      >
                        Share
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
