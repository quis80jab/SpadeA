"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useArgumentStore } from "@/src/state/argumentStore";

interface IntroLine {
  text: string;
  style: "label" | "title" | "charge" | "context" | "tension";
  delay: number;
}

export default function CourtIntro() {
  const router = useRouter();
  const { caseData, setPhase } = useArgumentStore();
  const [visibleLines, setVisibleLines] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  const lines: IntroLine[] = caseData
    ? [
        { text: "COURT IS NOW IN SESSION", style: "label", delay: 0 },
        { text: caseData.title, style: "title", delay: 800 },
        { text: caseData.charge, style: "charge", delay: 1800 },
        { text: caseData.context, style: "context", delay: 3000 },
        { text: `\u201C${caseData.philosophical_tension}\u201D`, style: "tension", delay: 4500 },
      ]
    : [];

  useEffect(() => {
    if (!caseData) {
      router.replace("/");
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    lines.forEach((line, idx) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((v) => Math.max(v, idx + 1));
        }, line.delay)
      );
    });

    // Mark all lines as revealed after the last one appears
    const lastDelay = lines[lines.length - 1]?.delay ?? 0;
    timers.push(
      setTimeout(() => {
        setAllRevealed(true);
      }, lastDelay + 600)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData]);

  const handleBeginTrial = () => {
    setPhase("chat");
    router.push("/chat");
  };

  if (!caseData) return null;

  const styleMap: Record<IntroLine["style"], string> = {
    label: "text-xs tracking-[0.4em] font-semibold",
    title: "text-2xl md:text-3xl font-semibold tracking-wide text-white",
    charge: "text-base md:text-lg font-medium italic",
    context: "text-sm leading-relaxed",
    tension: "text-sm md:text-base italic leading-relaxed",
  };

  const colorMap: Record<IntroLine["style"], string> = {
    label: "var(--accent)",
    title: "var(--text-primary)",
    charge: "var(--primary)",
    context: "var(--text-secondary)",
    tension: "var(--accent)",
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-dvh p-8 select-none"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-7 max-w-lg">
        <AnimatePresence>
          {lines.slice(0, visibleLines).map((line, idx) => (
            <motion.div
              key={idx}
              initial={line.style === "title" ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 16 }}
              animate={line.style === "title" ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
              transition={{
                duration: line.style === "title" ? 0.6 : 0.5,
                type: line.style === "title" ? "spring" : "tween",
              }}
              className="text-center"
            >
              <p className={styleMap[line.style]} style={{ color: colorMap[line.style] }}>
                {line.text}
              </p>
              {line.style === "title" && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="h-[2px] mx-auto mt-3 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Begin Trial button — appears after all lines are revealed */}
      <AnimatePresence>
        {allRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute bottom-16"
          >
            <button
              onClick={handleBeginTrial}
              className="px-10 py-3.5 rounded-full text-white text-sm font-semibold tracking-widest
                         transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 24px rgba(255,56,92,0.35)",
              }}
            >
              BEGIN TRIAL
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
