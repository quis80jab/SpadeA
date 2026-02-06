"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHistoryStore } from "@/src/state/historyStore";
import { HealthBarStatic } from "@/src/components/HealthBar";
import { MessageBubble } from "@/src/components/MessageBubble";
import type { SavedArgument } from "@/src/state/types";

export default function ArgumentViewer() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { hydrate, getArgument } = useHistoryStore();
  const [argument, setArgument] = useState<SavedArgument | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const arg = getArgument(id);
    if (arg) {
      setArgument(arg);
    }
  }, [id, getArgument]);

  if (!argument) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Argument not found.</p>
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
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-white truncate">{argument.caseData.title}</h1>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {argument.exchangeCount} exchanges &middot; {new Date(argument.createdAt).toLocaleDateString()}
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
        style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
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
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
