"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// ─── Flash Overlay ───

interface FlashOverlayProps {
  visible: boolean;
  color?: string;
}

export function FlashOverlay({
  visible,
  color = "rgba(255,255,255,0.9)",
}: FlashOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{ background: color }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── OBJECTION! Banner ───

interface ObjectionBannerProps {
  visible: boolean;
  text?: string;
}

export function ObjectionBanner({
  visible,
  text = "OBJECTION!",
}: ObjectionBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
        >
          <div
            className="px-12 py-4 rounded"
            style={{
              background: "var(--objection)",
              boxShadow: "0 0 60px rgba(255, 68, 68, 0.8)",
            }}
          >
            <span
              className="text-4xl md:text-5xl font-black text-white tracking-widest"
              style={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Screen Shake Container ───

interface ShakeContainerProps {
  shake: boolean;
  intensity: number;
  children: React.ReactNode;
}

export function ShakeContainer({ shake, intensity, children }: ShakeContainerProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (shake && intensity >= 4) {
      const mag = Math.min((intensity - 3) * 2, 10);
      controls.start({
        x: [0, mag, -mag, mag * 0.6, -mag * 0.6, mag * 0.3, 0],
        transition: { duration: 0.3, ease: "easeOut" },
      });
    }
  }, [shake, intensity, controls]);

  return (
    <motion.div animate={controls} className="flex flex-col h-full">
      {children}
    </motion.div>
  );
}

// ─── Gavel Slam ───

interface GavelSlamProps {
  visible: boolean;
}

export function GavelSlam({ visible }: GavelSlamProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <motion.span
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="text-8xl"
          >
            🔨
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-3xl font-black tracking-[0.3em] mt-4"
            style={{ color: "var(--accent)" }}
          >
            ORDER!
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── GUILTY Overlay (surrender / defendant KO) ───

interface GuiltyOverlayProps {
  visible: boolean;
  reason?: "surrender" | "ko";
}

export function GuiltyOverlay({ visible, reason = "surrender" }: GuiltyOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "rgba(10,10,26,0.92)" }}
        >
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", duration: 0.4 }}
            className="text-6xl md:text-7xl font-black tracking-[0.4em]"
            style={{
              color: "var(--guilty)",
              textShadow: "0 0 60px rgba(220,38,38,0.6)",
            }}
          >
            GUILTY
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-base mt-6 tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {reason === "surrender"
              ? "The defendant has surrendered."
              : "The prosecution's case was too strong."}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── NOT GUILTY / Victory Overlay (attorney KO) ───

interface VictoryOverlayProps {
  visible: boolean;
}

export function VictoryOverlay({ visible }: VictoryOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "rgba(10,26,10,0.92)" }}
        >
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", duration: 0.4 }}
            className="text-5xl md:text-6xl font-black tracking-[0.3em] text-center"
            style={{
              color: "#22c55e",
              textShadow: "0 0 60px rgba(34,197,94,0.6)",
            }}
          >
            NOT GUILTY
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-base mt-6 tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            The prosecution&apos;s case has been demolished.
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
