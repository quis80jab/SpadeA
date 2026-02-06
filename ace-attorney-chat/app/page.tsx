"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useArgumentStore } from "@/src/state/argumentStore";
import { generateCase } from "@/src/agents/caseCreator";
import { ConversationHistory } from "@/src/components/ConversationHistory";

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { initCase, setGeneratingCase, reset } = useArgumentStore();

  const handleEnter = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setGeneratingCase(true);
    reset();

    try {
      const caseData = await generateCase();
      initCase(caseData);
      setGeneratingCase(false);
      router.push("/court-intro");
    } catch (err: unknown) {
      setGeneratingCase(false);
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to generate case";
      setError(msg);
    }
  }, [loading, initCase, setGeneratingCase, reset, router]);

  const handleViewArgument = useCallback(
    (id: string) => {
      router.push(`/argument/${id}`);
    },
    [router]
  );

  return (
    <div
      className="flex flex-col h-dvh select-none"
      style={{ background: "var(--bg)" }}
    >
      {/* Top section: title + button */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center pt-14 pb-4 px-8 shrink-0"
      >
        <p className="text-[10px] tracking-[0.5em] font-medium mb-1" style={{ color: "var(--accent)" }}>
          ACE ATTORNEY
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
          AI Courtroom
        </h1>
        <div className="w-10 h-[2px] mx-auto mt-3 mb-3 rounded-full" style={{ background: "var(--primary)" }} />
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
          Where absurdity meets philosophy and justice is debatable
        </p>

        {/* Enter button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-3">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
              />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Preparing the case...</p>
            </div>
          ) : (
            <button
              onClick={handleEnter}
              className="w-full py-3.5 px-8 rounded-full text-white text-sm font-semibold tracking-widest
                         transition-all duration-200 hover:brightness-110 active:scale-[0.98] cursor-pointer"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 20px rgba(255, 56, 92, 0.3)",
              }}
            >
              ENTER THE COURTROOM
            </button>
          )}
          {error && (
            <p className="text-xs text-center mt-1" style={{ color: "var(--primary)" }}>{error}</p>
          )}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="px-8 py-2 shrink-0">
        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* History section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex-1 min-h-0 flex flex-col"
      >
        <h2
          className="text-xs font-medium tracking-wider uppercase px-8 mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Past Arguments
        </h2>
        <ConversationHistory onViewArgument={handleViewArgument} />
      </motion.div>

      {/* Footer */}
      <p className="text-[10px] text-center py-3 shrink-0" style={{ color: "var(--text-muted)" }}>
        Powered by Claude AI
      </p>
    </div>
  );
}
