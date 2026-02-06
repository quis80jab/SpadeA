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
import type { SuggestedReply, CasePoint } from "@/src/state/types";

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
    <div className="flex gap-2 mb-2">
      <span className="text-xs font-extrabold shrink-0 w-7 pt-0.5" style={{ color: "var(--primary)" }}>{p.id}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white">{p.claim}</p>
        <span className="text-[10px] font-bold tracking-wider" style={{ color: statusColor(p.status) }}>{p.status.toUpperCase()}</span>
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
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg max-h-[80dvh] rounded-t-2xl p-6 overflow-y-auto"
            style={{ background: "var(--bg-light)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold text-white">Case Summary</h2>
              <button onClick={onClose} className="text-xl p-2 cursor-pointer" style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
            <Section title="The Case">
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{caseData.charge}</p>
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{caseData.context}</p>
              <p className="text-sm italic" style={{ color: "var(--accent)" }}>&ldquo;{caseData.philosophical_tension}&rdquo;</p>
            </Section>
            <Section title="Prosecution Points">
              {attorneyPoints.map((p) => <PointRow key={p.id} p={p} />)}
            </Section>
            <Section title="Defense Points">
              {defendantPoints.map((p) => <PointRow key={p.id} p={p} />)}
            </Section>
            <Section title="Score">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Attorney: {analysis.attorneyScore.validPoints} valid, {analysis.attorneyScore.fallacies} fallacies</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Defendant: {analysis.defendantScore.validPoints} valid, {analysis.defendantScore.fallacies} fallacies</p>
            </Section>
            {analysis.fallacies.length > 0 && (
              <Section title="Fallacies Identified">
                {analysis.fallacies.map((f, idx) => (
                  <p key={idx} className="text-sm" style={{ color: "var(--text-secondary)" }}>• {f.side}: {f.type} — {f.context}</p>
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
    <div className="mb-4">
      <h3 className="text-xs font-bold tracking-wider uppercase mt-4 mb-2" style={{ color: "var(--accent)" }}>{title}</h3>
      {children}
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

  const {
    caseData,
    messages,
    suggestions,
    exchangeCount,
    health,
    isAttorneyThinking,
    isSuggestionsLoading,
    addMessage,
    setSuggestions,
    incrementExchange,
    updatePoints,
    updateAnalysis,
    applyDamage,
    setAttorneyThinking,
    setSuggestionsLoading,
    setPhase,
    setOutcome,
    persist,
  } = useArgumentStore();

  const { saveArgument } = useHistoryStore();

  // ─── Save to history helper ───
  const saveToHistory = useCallback(
    (outcome: "won" | "lost") => {
      const state = useArgumentStore.getState();
      if (!state.caseData) return;
      saveArgument({
        caseData: state.caseData,
        messages: state.messages,
        outcome,
        finalHealth: state.health,
        exchangeCount: state.exchangeCount,
      });
    },
    [saveArgument]
  );

  // ─── Redirect if no case ───
  useEffect(() => {
    if (!caseData) router.replace("/");
  }, [caseData, router]);

  // ─── Initial attorney opening ───
  useEffect(() => {
    if (caseData && messages.length === 0) handleAttorneyOpening();
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
        saveToHistory("won");
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
        saveToHistory("lost");
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
        saveToHistory("lost");
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

    // Normal flow
    setAttorneyThinking(true);
    try {
      const lawyerResp = await getLawyerResponse(text);

      if (lawyerResp.updated_points.length > 0) updatePoints(lawyerResp.updated_points);
      if (lawyerResp.fallacies_identified.length > 0 || lawyerResp.assumptions_challenged.length > 0) {
        updateAnalysis(lawyerResp.fallacies_identified, lawyerResp.assumptions_challenged);
      }

      addMessage(lawyerResp.message, "attorney", lawyerResp.intensity_level);
      setAttorneyThinking(false);
      triggerIntensityEffects(lawyerResp.intensity_level);

      // Apply health damage
      setLastDmgAtt(lawyerResp.damage_to_attorney);
      setLastDmgDef(lawyerResp.damage_to_defendant);
      const koResult = applyDamage(lawyerResp.damage_to_attorney, lawyerResp.damage_to_defendant);

      if (koResult !== "none") {
        await handleKO(koResult);
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
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 className="text-sm font-bold text-white truncate flex-1 mr-2">{caseData.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Exchange {exchangeCount}</span>
            <button
              onClick={() => setShowCaseModal(true)}
              className="text-xs px-3 py-1 rounded-full border cursor-pointer hover:brightness-125 transition-all"
              style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
            >
              📋 Case
            </button>
          </div>
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
          <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              placeholder="Or type your own argument..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              className="flex-1 rounded-full px-4 py-2.5 text-sm border outline-none disabled:opacity-50 placeholder:text-[var(--text-muted)]"
              style={{ background: "var(--bg-light)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleSendCustom}
              disabled={!customText.trim() || busy}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--primary)" }}
            >
              ⚡
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
