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
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f23 50%, #1a1a2e 100%)" }}
    >
      {/* Top section: title + button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center pt-10 pb-2 px-6 shrink-0"
      >
        <p className="text-[10px] tracking-[0.5em] font-semibold mb-0.5" style={{ color: "var(--accent)" }}>
          ACE ATTORNEY
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-wide text-white">
          AI COURTROOM
        </h1>
        <div className="w-12 h-0.5 mx-auto mt-2 mb-2" style={{ background: "var(--primary)" }} />
        <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          Where absurdity meets philosophy and justice is debatable
        </p>

        {/* Enter button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
              />
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Preparing the case...</p>
            </div>
          ) : (
            <button
              onClick={handleEnter}
              className="w-full py-3 px-6 rounded-xl text-white text-base font-extrabold tracking-widest
                         transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 24px rgba(233, 69, 96, 0.4)",
              }}
            >
              ENTER THE COURTROOM
            </button>
          )}
          {error && (
            <p className="text-[11px] text-center" style={{ color: "var(--primary)" }}>{error}</p>
          )}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="px-6 py-3 shrink-0">
        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* History section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="flex-1 min-h-0 flex flex-col"
      >
        <h2
          className="text-xs font-bold tracking-wider uppercase px-6 mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Past Arguments
        </h2>
        <ConversationHistory onViewArgument={handleViewArgument} />
      </motion.div>

      {/* Footer */}
      <p className="text-[10px] text-center py-2 shrink-0" style={{ color: "var(--text-muted)" }}>
        Powered by Claude AI
      </p>
    </div>
  );
}
