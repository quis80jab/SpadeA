import { create } from 'zustand';
import {
  ArgumentState,
  CaseData,
  HealthState,
  Message,
  SuggestedReply,
  GamePhase,
  PointUpdate,
  FallacyEntry,
  AssumptionEntry,
  EvidenceCard,
} from './types';
import {
  applyPointUpdates,
  applyFallacies,
  applyAssumptions,
  recalcScores,
  createInitialAnalysis,
} from './markdownManager';

const STORAGE_KEY = 'ace_attorney_state';

const DEFAULT_HEALTH: HealthState = { attorneyHP: 100, defendantHP: 100, maxHP: 100 };

interface ArgumentActions {
  initCase: (caseData: CaseData) => void;
  setPhase: (phase: GamePhase) => void;
  reset: () => void;
  addMessage: (text: string, sender: 'attorney' | 'user', intensity?: number) => void;
  setSuggestions: (suggestions: SuggestedReply[]) => void;
  incrementExchange: () => void;
  updatePoints: (updates: PointUpdate[]) => void;
  updateAnalysis: (fallacies: FallacyEntry[], assumptions: AssumptionEntry[]) => void;
  setGeneratingCase: (v: boolean) => void;
  setAttorneyThinking: (v: boolean) => void;
  setSuggestionsLoading: (v: boolean) => void;
  setOutcome: (outcome: 'won' | 'lost') => void;
  applyDamage: (toAttorney: number, toDefendant: number) => 'none' | 'attorney_ko' | 'defendant_ko';
  applyDamageToOne: (target: 'attorney' | 'defendant', amount: number) => 'none' | 'attorney_ko' | 'defendant_ko';
  // Evidence cards
  evidenceCards: EvidenceCard[];
  selectEvidenceCards: (ids: string[]) => void;
  useEvidenceCard: (id: string) => void;
  persist: () => void;
  hydrate: () => void;
  clearPersisted: () => void;
}

const initialState: ArgumentState = {
  phase: 'splash',
  caseData: null,
  attorneyPoints: [],
  defendantPoints: [],
  analysis: createInitialAnalysis(),
  health: { ...DEFAULT_HEALTH },
  messages: [],
  suggestions: [],
  evidenceCards: [],
  exchangeCount: 0,
  isGeneratingCase: false,
  isAttorneyThinking: false,
  isSuggestionsLoading: false,
  outcome: null,
};

export const useArgumentStore = create<ArgumentState & ArgumentActions>((set, get) => ({
  ...initialState,

  initCase: (caseData: CaseData) =>
    set({
      caseData,
      attorneyPoints: caseData.attorney_points,
      defendantPoints: caseData.defendant_points,
      analysis: {
        ...createInitialAnalysis(),
        attorneyScore: {
          validPoints: caseData.attorney_points.length,
          fallacies: 0,
          challenged: 0,
        },
        defendantScore: {
          validPoints: caseData.defendant_points.length,
          fallacies: 0,
          challenged: 0,
        },
      },
      health: { ...DEFAULT_HEALTH },
      messages: [],
      suggestions: [],
      evidenceCards: [],
      exchangeCount: 0,
      outcome: null,
      phase: 'intro',
    }),

  setPhase: (phase: GamePhase) => set({ phase }),

  reset: () => set({ ...initialState }),

  addMessage: (text: string, sender: 'attorney' | 'user', intensity?: number) => {
    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      sender,
      timestamp: Date.now(),
      intensity,
    };
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  setSuggestions: (suggestions: SuggestedReply[]) => set({ suggestions }),

  incrementExchange: () =>
    set((state) => ({ exchangeCount: state.exchangeCount + 1 })),

  updatePoints: (updates: PointUpdate[]) =>
    set((state) => {
      const result = applyPointUpdates(state.attorneyPoints, state.defendantPoints, updates);
      const analysis = recalcScores(state.analysis, result.attorneyPoints, result.defendantPoints);
      return { ...result, analysis };
    }),

  updateAnalysis: (fallacies: FallacyEntry[], assumptions: AssumptionEntry[]) =>
    set((state) => {
      let analysis = state.analysis;
      if (fallacies.length > 0) {
        analysis = applyFallacies(analysis, fallacies, state.exchangeCount);
      }
      if (assumptions.length > 0) {
        analysis = applyAssumptions(analysis, assumptions);
      }
      return { analysis };
    }),

  setGeneratingCase: (v: boolean) => set({ isGeneratingCase: v }),
  setAttorneyThinking: (v: boolean) => set({ isAttorneyThinking: v }),
  setSuggestionsLoading: (v: boolean) => set({ isSuggestionsLoading: v }),

  setOutcome: (outcome: 'won' | 'lost') => set({ outcome, phase: 'ended' }),

  applyDamage: (toAttorney: number, toDefendant: number) => {
    const state = get();
    const newAttorneyHP = Math.max(0, state.health.attorneyHP - toAttorney);
    const newDefendantHP = Math.max(0, state.health.defendantHP - toDefendant);

    set({
      health: {
        ...state.health,
        attorneyHP: newAttorneyHP,
        defendantHP: newDefendantHP,
      },
    });

    if (newAttorneyHP <= 0) return 'attorney_ko';
    if (newDefendantHP <= 0) return 'defendant_ko';
    return 'none';
  },

  applyDamageToOne: (target: 'attorney' | 'defendant', amount: number) => {
    const state = get();
    if (target === 'attorney') {
      const newHP = Math.max(0, state.health.attorneyHP - amount);
      set({ health: { ...state.health, attorneyHP: newHP } });
      if (newHP <= 0) return 'attorney_ko';
    } else {
      const newHP = Math.max(0, state.health.defendantHP - amount);
      set({ health: { ...state.health, defendantHP: newHP } });
      if (newHP <= 0) return 'defendant_ko';
    }
    return 'none';
  },

  // Evidence cards
  evidenceCards: [],

  selectEvidenceCards: (ids: string[]) => {
    const state = get();
    if (!state.caseData) return;
    const cards: EvidenceCard[] = state.caseData.defendant_points
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ id: p.id, claim: p.claim, evidence: p.evidence, used: false }));
    set({ evidenceCards: cards });
  },

  useEvidenceCard: (id: string) => {
    set((state) => ({
      evidenceCards: state.evidenceCards.map((c) =>
        c.id === id ? { ...c, used: true } : c
      ),
    }));
  },

  persist: () => {
    try {
      const state = get();
      const data: ArgumentState = {
        phase: state.phase,
        caseData: state.caseData,
        attorneyPoints: state.attorneyPoints,
        defendantPoints: state.defendantPoints,
        analysis: state.analysis,
        health: state.health,
        messages: state.messages,
        suggestions: state.suggestions,
        evidenceCards: state.evidenceCards,
        exchangeCount: state.exchangeCount,
        isGeneratingCase: false,
        isAttorneyThinking: false,
        isSuggestionsLoading: false,
        outcome: state.outcome,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage not available (SSR)
    }
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ArgumentState;
        set({
          ...data,
          health: data.health ?? { ...DEFAULT_HEALTH },
          isGeneratingCase: false,
          isAttorneyThinking: false,
          isSuggestionsLoading: false,
        });
      }
    } catch {
      // Ignore hydration errors
    }
  },

  clearPersisted: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available (SSR)
    }
  },
}));
