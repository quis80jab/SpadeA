"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useArgumentStore } from "@/src/state/argumentStore";
import { useHistoryStore } from "@/src/state/historyStore";
import { getLawyerResponse } from "@/src/agents/lawyer";
import { getDefendantSuggestions } from "@/src/agents/defendant";
import { MessageBubble } from "@/src/components/MessageBubble";
import { TypingIndicator } from "@/src/components/TypingIndicator";
import { SuggestionCarousel } from "@/src/components/SuggestionCarousel";
import { HealthBar } from "@/src/components/HealthBar";
import {
  FlashOverlay,
  ObjectionBanner,
  ShakeContainer,
  GavelSlam,
  GuiltyOverlay,
  VictoryOverlay,
} from "@/src/components/IntensityEffects";
import { createClient } from "@/src/lib/supabase/client";
import type { SuggestedReply, CasePoint, EvidenceCard } from "@/src/state/types";

// ─── Case Summary Modal ───

function CaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { caseData, attorneyPoints, defendantPoints, analysis } = useArgumentStore();
  if (!caseData) return null;

  const statusColor = (status: string) => {
    switch (status) {
      case "unchallenged": return "var(--text-secondary)";
      case "challenged": return "var(--hold-it)";
      case "refuted": return "var(--objection)";
      case "proven": return "var(--take-that)";
      default: return "var(--text-muted)";
    }
  };

  const PointRow = ({ p }: { p: CasePoint }) => (
    <div className="flex gap-3 mb-3">
      <span className="text-xs font-semibold shrink-0 w-7 pt-0.5" style={{ color: "var(--primary)" }}>{p.id}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-relaxed">{p.claim}</p>
        <span className="text-[10px] font-medium tracking-wider" style={{ color: statusColor(p.status) }}>{p.status.toUpperCase()}</span>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-lg max-h-[80dvh] rounded-t-3xl px-7 pt-6 pb-8 overflow-y-auto"
            style={{ background: "var(--bg-light)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Case Summary</h2>
              <button onClick={onClose} className="text-sm p-2 cursor-pointer rounded-full hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <Section title="The Case">
              <p className="text-sm mb-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{caseData.charge}</p>
              <p className="text-sm mb-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{caseData.context}</p>
              <p className="text-sm italic" style={{ color: "var(--accent)" }}>&ldquo;{caseData.philosophical_tension}&rdquo;</p>
            </Section>
            <Section title="Prosecution Points">
              {attorneyPoints.map((p) => <PointRow key={p.id} p={p} />)}
            </Section>
            <Section title="Defense Points">
              {defendantPoints.map((p) => <PointRow key={p.id} p={p} />)}
            </Section>
            <Section title="Score">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Prosecution: {analysis.attorneyScore.validPoints} valid, {analysis.attorneyScore.fallacies} fallacies</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Defense: {analysis.defendantScore.validPoints} valid, {analysis.defendantScore.fallacies} fallacies</p>
            </Section>
            {analysis.fallacies.length > 0 && (
              <Section title="Fallacies Identified">
                {analysis.fallacies.map((f, idx) => (
                  <p key={idx} className="text-sm mb-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-medium">{f.side}:</span> {f.type} &mdash; {f.context}
                  </p>
                ))}
              </Section>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-medium tracking-wider uppercase mt-5 mb-2.5" style={{ color: "var(--accent)" }}>{title}</h3>
      {children}
    </div>
  );
}

// ─── Evidence Card Tray ───

function EvidenceTray({
  cards,
  onDeploy,
  disabled,
}: {
  cards: EvidenceCard[];
  onDeploy: (card: EvidenceCard) => void;
  disabled: boolean;
}) {
  const available = cards.filter((c) => !c.used);
  if (available.length === 0) return null;

  return (
    <div className="px-4 py-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <p className="text-[10px] font-medium tracking-wider uppercase mb-1.5" style={{ color: "var(--accent)" }}>
        Evidence ({available.length} remaining)
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => !card.used && !disabled && onDeploy(card)}
            disabled={card.used || disabled}
            className="shrink-0 px-3.5 py-2 rounded-xl text-left transition-all duration-150
                       active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: card.used ? "rgba(255,255,255,0.02)" : "rgba(255,56,92,0.1)",
              border: card.used
                ? "1px solid rgba(255,255,255,0.04)"
                : "1px solid rgba(255,56,92,0.3)",
              opacity: card.used ? 0.35 : disabled ? 0.5 : 1,
              maxWidth: 200,
            }}
          >
            <span
              className="text-[10px] font-bold block"
              style={{ color: card.used ? "var(--text-muted)" : "var(--primary)" }}
            >
              {card.id} {card.used && "— USED"}
            </span>
            <span
              className="text-[11px] leading-tight block mt-0.5 line-clamp-2"
              style={{ color: card.used ? "var(--text-muted)" : "var(--text-secondary)" }}
            >
              {card.claim}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Chat Page ───

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [customText, setCustomText] = useState("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Health damage display
  const [lastDmgAtt, setLastDmgAtt] = useState(0);
  const [lastDmgDef, setLastDmgDef] = useState(0);

  // Intensity effects
  const [showFlash, setShowFlash] = useState(false);
  const [flashColor, setFlashColor] = useState("rgba(255,255,255,0.9)");
  const [showObjection, setShowObjection] = useState(false);
  const [objectionText, setObjectionText] = useState("OBJECTION!");
  const [shakeActive, setShakeActive] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showGavel, setShowGavel] = useState(false);
  const [showGuilty, setShowGuilty] = useState(false);
  const [guiltyReason, setGuiltyReason] = useState<"surrender" | "ko">("surrender");
  const [showVictory, setShowVictory] = useState(false);

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasOpenedRef = useRef(false);

  const {
    caseData,
    messages,
    suggestions,
    evidenceCards,
    exchangeCount,
    health,
    isAttorneyThinking,
    isSuggestionsLoading,
    addMessage,
    setSuggestions,
    incrementExchange,
    updatePoints,
    updateAnalysis,
    applyDamageToOne,
    setAttorneyThinking,
    setSuggestionsLoading,
    setPhase,
    setOutcome,
    useEvidenceCard,
    persist,
  } = useArgumentStore();

  const { saveArgument } = useHistoryStore();

  // ─── Score calculation ───
  const calculateScore = useCallback((outcome: "won" | "lost") => {
    const state = useArgumentStore.getState();
    const { health, exchangeCount } = state;
    // Damage dealt to the attorney (opponent)
    const damageDealt = health.maxHP - health.attorneyHP;
    // Bonus for longer games (more exchanges = more engagement)
    const exchangeBonus = Math.min(exchangeCount * 3, 30);
    // Win bonus
    const winBonus = outcome === "won" ? 50 : 0;
    return damageDealt + exchangeBonus + winBonus;
  }, []);

  // ─── Save to history helper ───
  const saveToHistory = useCallback(
    async (outcome: "won" | "lost") => {
      const state = useArgumentStore.getState();
      if (!state.caseData) return;
      const score = calculateScore(outcome);

      await saveArgument({
        caseData: state.caseData,
        messages: state.messages,
        outcome,
        finalHealth: state.health,
        exchangeCount: state.exchangeCount,
        score,
      });

      // Update profile stats in Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const field = outcome === "won" ? "wins" : "losses";
        // Use RPC-style increment via raw update
        const { data: profile } = await supabase
          .from("profiles")
          .select("wins, losses, total_score")
          .eq("id", user.id)
          .single();

        if (profile) {
          const p = profile as { wins: number; losses: number; total_score: number };
          await supabase
            .from("profiles")
            .update({
              [field]: p[field] + 1,
              total_score: p.total_score + score,
            })
            .eq("id", user.id);
        }
      }
    },
    [saveArgument, calculateScore]
  );

  // ─── Redirect if no case ───
  useEffect(() => {
    if (!caseData) router.replace("/");
  }, [caseData, router]);

  // ─── Initial attorney opening ───
  useEffect(() => {
    if (caseData && messages.length === 0 && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      handleAttorneyOpening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData]);

  // ─── Auto-scroll ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAttorneyThinking]);

  // ─── Swipe gestures ───
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!swipeStartRef.current) return;
      const dx = e.clientX - swipeStartRef.current.x;
      const dy = e.clientY - swipeStartRef.current.y;
      swipeStartRef.current = null;
      if (dx > 100 && Math.abs(dy) < 80) { router.replace("/"); return; }
      if (dy > 50 && Math.abs(dx) < 50) setShowCaseModal(true);
    },
    [router]
  );

  // ─── Trigger intensity effects ───
  const triggerIntensityEffects = useCallback((intensity: number) => {
    if (intensity >= 4) {
      setShakeIntensity(intensity);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 350);
    }
    if (intensity >= 7 && intensity < 10) {
      setShowFlash(true);
      setFlashColor("rgba(255,255,255,0.9)");
      setTimeout(() => setShowFlash(false), 500);
      const state = useArgumentStore.getState();
      const latest = state.messages[state.messages.length - 1];
      if (latest) {
        const upper = latest.text.toUpperCase();
        if (upper.includes("OBJECTION")) { setObjectionText("OBJECTION!"); setShowObjection(true); setTimeout(() => setShowObjection(false), 1200); }
        else if (upper.includes("HOLD IT")) { setObjectionText("HOLD IT!"); setShowObjection(true); setTimeout(() => setShowObjection(false), 1200); }
        else if (upper.includes("TAKE THAT")) { setObjectionText("TAKE THAT!"); setShowObjection(true); setTimeout(() => setShowObjection(false), 1200); }
      }
    }
    if (intensity >= 10) {
      setShowGavel(true);
      setShowFlash(true);
      setFlashColor("rgba(255,255,255,0.9)");
      setTimeout(() => { setShowFlash(false); setShowGavel(false); }, 1500);
    }
  }, []);

  // ─── Handle KO (win or loss by health) ───
  const handleKO = useCallback(
    async (result: "attorney_ko" | "defendant_ko") => {
      setGameOver(true);
      setSuggestions([]);
      await new Promise((r) => setTimeout(r, 800));

      if (result === "attorney_ko") {
        // User wins!
        setShowVictory(true);
        triggerIntensityEffects(10);
        await saveToHistory("won");
        persist();
        setTimeout(() => {
          setOutcome("won");
          setShowVictory(false);
          router.replace("/");
        }, 3500);
      } else {
        // User loses
        setGuiltyReason("ko");
        setShowGuilty(true);
        triggerIntensityEffects(10);
        await saveToHistory("lost");
        persist();
        setTimeout(() => {
          setOutcome("lost");
          setShowGuilty(false);
          router.replace("/");
        }, 3500);
      }
    },
    [triggerIntensityEffects, saveToHistory, persist, setOutcome, setSuggestions, router]
  );

  // ─── Attorney opening ───
  const handleAttorneyOpening = async () => {
    if (!caseData) return;
    setAttorneyThinking(true);
    await new Promise((r) => setTimeout(r, 1500));
    addMessage(caseData.opening_statement, "attorney", 5);
    setAttorneyThinking(false);
    triggerIntensityEffects(5);

    setSuggestionsLoading(true);
    try {
      const defResponse = await getDefendantSuggestions(0);
      setSuggestions(defResponse.suggestions);
    } catch {
      setSuggestions([
        { text: "OBJECTION! I demand to see the evidence!", type: "objection", variant: "default" },
        { text: "That opening statement is misleading!", type: "strategic", variant: "default" },
        { text: "The defense is ready to present its case!", type: "dramatic", variant: "default" },
        { text: "Let's examine the facts more carefully.", type: "strategic", variant: "default" },
      ]);
    }
    setSuggestionsLoading(false);
  };

  // ─── Handle user message (core game loop) ───
  const handleUserMessage = async (text: string) => {
    if (busy || gameOver || !text.trim()) return;
    setBusy(true);

    const isSurrender = text === "...I surrender.";

    addMessage(text.trim(), "user");
    incrementExchange();
    setSuggestions([]);
    setCustomText("");

    // Check if user deployed evidence — look for evidence card IDs in the message
    let evidenceBonus = 0;
    const availableCards = useArgumentStore.getState().evidenceCards.filter((c) => !c.used);
    for (const card of availableCards) {
      if (text.toUpperCase().includes(card.id)) {
        useEvidenceCard(card.id);
        evidenceBonus += 10;
        break; // one card per message
      }
    }

    if (isSurrender) {
      setPhase("surrender");
      await new Promise((r) => setTimeout(r, 2000));

      setAttorneyThinking(true);
      try {
        const lawyerResp = await getLawyerResponse(text, true);
        addMessage(lawyerResp.message, "attorney", 10);
        setAttorneyThinking(false);
        triggerIntensityEffects(10);
        await new Promise((r) => setTimeout(r, 1500));

        setGuiltyReason("surrender");
        setShowGuilty(true);
        await saveToHistory("lost");
        persist();

        setTimeout(() => {
          setOutcome("lost");
          setShowGuilty(false);
          router.replace("/");
        }, 3000);
      } catch {
        setAttorneyThinking(false);
      }
      setBusy(false);
      return;
    }

    // Normal flow — two-phase damage: user's attack lands first, then attorney counters
    setAttorneyThinking(true);
    try {
      const lawyerResp = await getLawyerResponse(text);

      // Phase 1: User's argument damages the attorney
      const userDmg = lawyerResp.damage_to_attorney + evidenceBonus;
      setLastDmgAtt(userDmg);
      setLastDmgDef(0);
      const koPhase1 = applyDamageToOne("attorney", userDmg);

      if (koPhase1 !== "none") {
        // Show the attorney's final message before KO
        if (lawyerResp.updated_points.length > 0) updatePoints(lawyerResp.updated_points);
        addMessage(lawyerResp.message, "attorney", lawyerResp.intensity_level);
        setAttorneyThinking(false);
        triggerIntensityEffects(lawyerResp.intensity_level);
        await handleKO(koPhase1);
        setBusy(false);
        return;
      }

      // Brief pause to let user see their damage land
      await new Promise((r) => setTimeout(r, 600));

      if (lawyerResp.updated_points.length > 0) updatePoints(lawyerResp.updated_points);
      if (lawyerResp.fallacies_identified.length > 0 || lawyerResp.assumptions_challenged.length > 0) {
        updateAnalysis(lawyerResp.fallacies_identified, lawyerResp.assumptions_challenged);
      }

      addMessage(lawyerResp.message, "attorney", lawyerResp.intensity_level);
      setAttorneyThinking(false);
      triggerIntensityEffects(lawyerResp.intensity_level);

      // Phase 2: Attorney's counter-argument damages the defendant
      await new Promise((r) => setTimeout(r, 400));
      setLastDmgAtt(0);
      setLastDmgDef(lawyerResp.damage_to_defendant);
      const koPhase2 = applyDamageToOne("defendant", lawyerResp.damage_to_defendant);

      if (koPhase2 !== "none") {
        await handleKO(koPhase2);
        setBusy(false);
        return;
      }

      // Get new suggestions
      setSuggestionsLoading(true);
      const currentExchange = useArgumentStore.getState().exchangeCount;
      try {
        const defResponse = await getDefendantSuggestions(currentExchange);
        setSuggestions(defResponse.suggestions);
      } catch {
        setSuggestions([
          { text: "OBJECTION! That argument is flawed!", type: "objection", variant: "default" },
          { text: "Let me present my evidence.", type: "evidence", variant: "default" },
          { text: "The truth will prevail!", type: "dramatic", variant: "default" },
        ]);
      }
      setSuggestionsLoading(false);
      persist();
    } catch {
      setAttorneyThinking(false);
      setSuggestionsLoading(false);
    }

    setBusy(false);
  };

  const handleChipSelect = useCallback(
    (suggestion: SuggestedReply) => { handleUserMessage(suggestion.text); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, gameOver]
  );

  const handleSendCustom = useCallback(() => {
    if (customText.trim()) handleUserMessage(customText.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customText, busy, gameOver]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendCustom(); } },
    [handleSendCustom]
  );

  if (!caseData) return null;

  return (
    <div
      className="h-dvh flex flex-col select-none overflow-hidden"
      style={{ background: "var(--bg)" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <ShakeContainer shake={shakeActive} intensity={shakeIntensity}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 className="text-sm font-medium text-white truncate flex-1 mr-3">{caseData.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
              Round {exchangeCount}
            </span>
            <button
              onClick={() => setShowCaseModal(true)}
              className="text-xs px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
              style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
            >
              Case Details
            </button>
          </div>
        </div>

        {/* Issue Banner */}
        <div
          className="px-5 py-3 shrink-0"
          style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)" }}>Charged with: </span>
            {caseData.charge}
          </p>
          {caseData.philosophical_tension && (
            <p className="text-[11px] italic mt-0.5" style={{ color: "var(--text-muted)" }}>
              &ldquo;{caseData.philosophical_tension}&rdquo;
            </p>
          )}
        </div>

        {/* Health Bar */}
        <HealthBar health={health} lastDamageToAttorney={lastDmgAtt} lastDamageToDefendant={lastDmgDef} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col py-2">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          {isAttorneyThinking && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Evidence Card Tray */}
        {!gameOver && evidenceCards.filter((c) => !c.used).length > 0 && (
          <EvidenceTray
            cards={evidenceCards}
            onDeploy={(card) => {
              handleUserMessage(`TAKE THAT! I present ${card.id} — ${card.claim}! The evidence clearly shows: ${card.evidence}`);
            }}
            disabled={busy}
          />
        )}

        {/* Suggestion Carousel */}
        {!gameOver && (
          <SuggestionCarousel
            suggestions={suggestions}
            onSelect={handleChipSelect}
            isLoading={isSuggestionsLoading}
            disabled={busy}
          />
        )}

        {/* Custom input */}
        {!gameOver && (
          <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              placeholder="Type your own argument..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              className="flex-1 rounded-xl px-4 py-3 text-sm border outline-none disabled:opacity-50
                         placeholder:text-[var(--text-muted)] transition-colors duration-150"
              style={{ background: "var(--bg-light)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleSendCustom}
              disabled={!customText.trim() || busy}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150
                         cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.96]"
              style={{ background: "var(--primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </ShakeContainer>

      {/* Overlays */}
      <FlashOverlay visible={showFlash} color={flashColor} />
      <ObjectionBanner visible={showObjection} text={objectionText} />
      <GavelSlam visible={showGavel} />
      <GuiltyOverlay visible={showGuilty} reason={guiltyReason} />
      <VictoryOverlay visible={showVictory} />

      {/* Case Modal */}
      <CaseModal open={showCaseModal} onClose={() => setShowCaseModal(false)} />
    </div>
  );
}
