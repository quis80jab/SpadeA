"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHistoryStore } from "@/src/state/historyStore";
import { createClient } from "@/src/lib/supabase/client";
import { HealthBarStatic } from "@/src/components/HealthBar";
import { MessageBubble } from "@/src/components/MessageBubble";
import type { SavedArgument } from "@/src/state/types";

export default function ArgumentViewer() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { hydrate, getArgument } = useHistoryStore();
  const [argument, setArgument] = useState<SavedArgument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await hydrate();

      // Try local store first
      const local = getArgument(id);
      if (local) {
        setArgument(local);
        setLoading(false);
        return;
      }

      // Try Supabase
      const supabase = createClient();
      const { data } = await supabase
        .from("arguments")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        const row = data as Record<string, unknown>;
        setArgument({
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
        });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Make argument public (for sharing)
  const handleMakePublic = useCallback(async () => {
    if (!argument) return;
    const supabase = createClient();
    await supabase
      .from("arguments")
      .update({ is_public: true })
      .eq("id", argument.id);
    setArgument({ ...argument, is_public: true });
  }, [argument]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!argument) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Argument not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm cursor-pointer"
          style={{ color: "var(--primary)" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const outcomeBadge = {
    won: { label: "Not Guilty", color: "#34D399" },
    lost: { label: "Guilty", color: "#F87171" },
    "in-progress": { label: "In Progress", color: "#E0B97A" },
  }[argument.outcome];

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150 hover:bg-[var(--hover-overlay)]"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{argument.caseData.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {argument.exchangeCount} rounds &middot; +{argument.score} pts &middot; {new Date(argument.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full shrink-0"
          style={{
            color: outcomeBadge.color,
            background: `${outcomeBadge.color}18`,
          }}
        >
          {outcomeBadge.label}
        </span>
      </div>

      {/* Health bar (frozen at final state) */}
      <HealthBarStatic health={argument.finalHealth} />

      {/* Case summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 py-3 shrink-0"
        style={{ background: "var(--hover-overlay)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-muted)" }}>Charged with: </span>
          {argument.caseData.charge}
        </p>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {argument.caseData.context}
        </p>
      </motion.div>

      {/* Read-only messages */}
      <div className="flex-1 overflow-y-auto flex flex-col py-2">
        {argument.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            argumentId={argument.id}
            isPublic={argument.is_public}
            onMakePublic={handleMakePublic}
          />
        ))}
      </div>
    </div>
  );
}
