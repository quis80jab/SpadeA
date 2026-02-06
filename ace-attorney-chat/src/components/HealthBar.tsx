"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HealthState } from "@/src/state/types";

interface HealthBarProps {
  health: HealthState;
  lastDamageToAttorney?: number;
  lastDamageToDefendant?: number;
}

function getBarColor(hp: number, maxHP: number): string {
  const pct = hp / maxHP;
  if (pct > 0.6) return "#22c55e";  // green
  if (pct > 0.35) return "#eab308"; // yellow
  if (pct > 0.15) return "#f97316"; // orange
  return "#ef4444";                  // red
}

function DamagePopup({ damage, side }: { damage: number; side: "left" | "right" }) {
  if (damage <= 0) return null;
  return (
    <motion.span
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -30 }}
      transition={{ duration: 1.2 }}
      className={`absolute top-0 text-sm font-black pointer-events-none ${
        side === "left" ? "left-2" : "right-2"
      }`}
      style={{ color: "#ef4444", textShadow: "0 0 8px rgba(239,68,68,0.6)" }}
    >
      -{damage}
    </motion.span>
  );
}

export function HealthBar({ health, lastDamageToAttorney = 0, lastDamageToDefendant = 0 }: HealthBarProps) {
  const [damageKey, setDamageKey] = useState(0);

  // Bump key to re-animate damage popups
  useEffect(() => {
    if (lastDamageToAttorney > 0 || lastDamageToDefendant > 0) {
      setDamageKey((k) => k + 1);
    }
  }, [lastDamageToAttorney, lastDamageToDefendant]);

  const attPct = (health.attorneyHP / health.maxHP) * 100;
  const defPct = (health.defendantHP / health.maxHP) * 100;
  const attColor = getBarColor(health.attorneyHP, health.maxHP);
  const defColor = getBarColor(health.defendantHP, health.maxHP);

  return (
    <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Attorney bar (left, drains right-to-left) */}
      <div className="flex-1 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "var(--primary)" }}>
            ⚔️ PROSECUTOR
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: attColor }}>
            {health.attorneyHP}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: attColor, originX: 0 }}
            animate={{ width: `${attPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <AnimatePresence mode="popLayout">
          {lastDamageToAttorney > 0 && (
            <DamagePopup key={`att-${damageKey}`} damage={lastDamageToAttorney} side="left" />
          )}
        </AnimatePresence>
      </div>

      {/* VS divider */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-[10px] font-black tracking-widest" style={{ color: "var(--text-muted)" }}>
          VS
        </span>
      </div>

      {/* Defendant bar (right, drains left-to-right) */}
      <div className="flex-1 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: defColor }}>
            {health.defendantHP}
          </span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "var(--accent)" }}>
            🛡️ YOU
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full ml-auto"
            style={{ background: defColor, originX: 1 }}
            animate={{ width: `${defPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <AnimatePresence mode="popLayout">
          {lastDamageToDefendant > 0 && (
            <DamagePopup key={`def-${damageKey}`} damage={lastDamageToDefendant} side="right" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Read-only version for argument viewer
export function HealthBarStatic({ health }: { health: HealthState }) {
  const attPct = (health.attorneyHP / health.maxHP) * 100;
  const defPct = (health.defendantHP / health.maxHP) * 100;
  const attColor = getBarColor(health.attorneyHP, health.maxHP);
  const defColor = getBarColor(health.defendantHP, health.maxHP);

  return (
    <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "var(--primary)" }}>⚔️ PROSECUTOR</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: attColor }}>{health.attorneyHP}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{ background: attColor, width: `${attPct}%` }} />
        </div>
      </div>
      <span className="text-[10px] font-black tracking-widest shrink-0" style={{ color: "var(--text-muted)" }}>VS</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: defColor }}>{health.defendantHP}</span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: "var(--accent)" }}>🛡️ YOU</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full ml-auto" style={{ background: defColor, width: `${defPct}%` }} />
        </div>
      </div>
    </div>
  );
}
