"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";
import { HealthBarStatic } from "@/src/components/HealthBar";
import { MessageBubble } from "@/src/components/MessageBubble";
import type { SavedArgument } from "@/src/state/types";

export default function SharedArgumentViewer() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const highlightMsgId = searchParams.get("m");
  const supabase = createClient();
  const [argument, setArgument] = useState<SavedArgument | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    async function load() {
      // Fetch the argument (RLS allows reading public arguments)
      const { data, error } = await supabase
        .from("arguments")
        .select("*")
        .eq("id", id)
        .eq("is_public", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

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
        starred: false,
        is_public: true,
        createdAt: new Date(row.created_at as string).getTime(),
      });

      // Fetch author name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", row.user_id as string)
        .single();

      if (profile) {
        setAuthorName((profile as Record<string, unknown>).display_name as string);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scroll to highlighted message after render
  useEffect(() => {
    if (!argument || !highlightMsgId || hasScrolled.current) return;
    // Small delay to let messages render
    const timer = setTimeout(() => {
      const el = document.getElementById(`msg-${highlightMsgId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolled.current = true;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [argument, highlightMsgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (notFound || !argument) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This argument doesn&apos;t exist or is private.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-sm px-4 py-2 rounded-full cursor-pointer"
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
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          Home
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{argument.caseData.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {authorName && `by ${authorName} \u00B7 `}
            {argument.exchangeCount} rounds &middot; +{argument.score} pts
          </p>
        </div>
        <span
          className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full shrink-0"
          style={{ color: outcomeBadge.color, background: `${outcomeBadge.color}18` }}
        >
          {outcomeBadge.label}
        </span>
      </div>

      {/* Health bar */}
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
      </motion.div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col py-2">
        {argument.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            argumentId={argument.id}
            isPublic={true}
            highlighted={msg.id === highlightMsgId}
          />
        ))}
      </div>
    </div>
  );
}
