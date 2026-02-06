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

  const lines: IntroLine[] = caseData
    ? [
        { text: "COURT IS NOW IN SESSION", style: "label", delay: 0 },
        { text: caseData.title, style: "title", delay: 800 },
        { text: caseData.charge, style: "charge", delay: 1800 },
        { text: caseData.context, style: "context", delay: 3000 },
        { text: `"${caseData.philosophical_tension}"`, style: "tension", delay: 4500 },
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

    const totalDelay = (lines[lines.length - 1]?.delay ?? 0) + 2500;
    timers.push(
      setTimeout(() => {
        setPhase("chat");
        router.push("/chat");
      }, totalDelay)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData]);

  if (!caseData) return null;

  const styleMap: Record<IntroLine["style"], string> = {
    label: "text-xs tracking-[0.4em] font-semibold",
    title: "text-2xl md:text-3xl font-black tracking-wide text-white",
    charge: "text-base md:text-lg font-semibold italic",
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
      className="flex flex-col items-center justify-center h-dvh p-6 select-none"
      style={{ background: "#0a0a1a" }}
    >
      <div className="flex flex-col items-center gap-6 max-w-lg">
        <AnimatePresence>
          {lines.slice(0, visibleLines).map((line, idx) => (
            <motion.div
              key={idx}
              initial={line.style === "title" ? { opacity: 0, scale: 0.9 } : { opacity: 0, y: 20 }}
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
                  animate={{ width: 80 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="h-[3px] mx-auto mt-3"
                  style={{ background: "var(--primary)" }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visibleLines >= lines.length && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-12 text-xs tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Entering courtroom...
        </motion.p>
      )}
    </div>
  );
}
