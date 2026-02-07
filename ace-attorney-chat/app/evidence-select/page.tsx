"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useArgumentStore } from "@/src/state/argumentStore";

const MAX_CARDS = 3;

export default function EvidenceSelectPage() {
  const router = useRouter();
  const { caseData, selectEvidenceCards, setPhase } = useArgumentStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!caseData) {
    router.replace("/");
    return null;
  }

  const points = caseData.defendant_points;

  const toggleCard = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_CARDS) {
        next.add(id);
      }
      return next;
    });
  };

  const handleReady = () => {
    selectEvidenceCards(Array.from(selected));
    setPhase("chat");
    router.push("/chat");
  };

  return (
    <div
      className="flex flex-col h-dvh select-none"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-10 pb-2 px-8 shrink-0"
      >
        <p
          className="text-[10px] tracking-[0.5em] font-medium mb-1"
          style={{ color: "var(--accent)" }}
        >
          PREPARE YOUR DEFENSE
        </p>
        <h1
          className="text-xl font-semibold tracking-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Select Your Evidence
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Choose up to {MAX_CARDS} evidence cards to bring into the courtroom.
          Deploy them during the trial for bonus damage.
        </p>
        <p
          className="text-xs mt-2 font-medium tabular-nums"
          style={{ color: selected.size > 0 ? "var(--take-that)" : "var(--text-muted)" }}
        >
          {selected.size} / {MAX_CARDS} selected
        </p>
      </motion.div>

      {/* Divider */}
      <div className="px-8 py-2 shrink-0">
        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          <AnimatePresence>
            {points.map((point, idx) => {
              const isSelected = selected.has(point.id);
              const isDisabled = !isSelected && selected.size >= MAX_CARDS;

              return (
                <motion.button
                  key={point.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.35 }}
                  onClick={() => !isDisabled && toggleCard(point.id)}
                  className="w-full text-left rounded-2xl p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  style={{
                    background: isSelected ? "rgba(255,56,92,0.12)" : "var(--bg-light)",
                    border: isSelected
                      ? "1.5px solid var(--primary)"
                      : "1.5px solid rgba(255,255,255,0.06)",
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* ID badge */}
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.06)",
                        color: isSelected ? "white" : "var(--text-muted)",
                      }}
                    >
                      {point.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {point.claim}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Evidence: {point.evidence}
                      </p>
                    </div>
                    {/* Checkmark */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: "var(--primary)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="px-6 pb-8 pt-4 shrink-0"
      >
        <button
          onClick={handleReady}
          className="w-full max-w-lg mx-auto block py-3.5 rounded-full text-white text-sm font-semibold tracking-widest
                     transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer"
          style={{
            background: "var(--primary)",
            boxShadow: "0 4px 20px rgba(255,56,92,0.3)",
          }}
        >
          {selected.size === 0 ? "SKIP — ENTER COURTROOM" : "READY TO ARGUE"}
        </button>
        {selected.size === 0 && (
          <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
            You can proceed without selecting evidence
          </p>
        )}
      </motion.div>
    </div>
  );
}
