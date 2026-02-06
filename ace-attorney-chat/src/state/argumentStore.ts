import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArgumentState,
  CaseData,
  CasePoint,
  Message,
  SuggestedReply,
  AnalysisState,
  GamePhase,
  PointUpdate,
  FallacyEntry,
  AssumptionEntry,
} from './types';
import {
  applyPointUpdates,
  applyFallacies,
  applyAssumptions,
  recalcScores,
  createInitialAnalysis,
} from './markdownManager';

const STORAGE_KEY = 'ace_attorney_state';

interface ArgumentActions {
  // Lifecycle
  initCase: (caseData: CaseData) => void;
  setPhase: (phase: GamePhase) => void;
  reset: () => void;

  // Messages
  addMessage: (text: string, sender: 'attorney' | 'user', intensity?: number) => void;
  setSuggestions: (suggestions: SuggestedReply[]) => void;
  incrementExchange: () => void;

  // State updates from agents
  updatePoints: (updates: PointUpdate[]) => void;
  updateAnalysis: (fallacies: FallacyEntry[], assumptions: AssumptionEntry[]) => void;

  // Loading states
  setGeneratingCase: (v: boolean) => void;
  setAttorneyThinking: (v: boolean) => void;
  setSuggestionsLoading: (v: boolean) => void;

  // Outcome
  setOutcome: (outcome: 'won' | 'lost') => void;

  // Persistence
  persist: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const initialState: ArgumentState = {
  phase: 'splash',
  caseData: null,
  attorneyPoints: [],
  defendantPoints: [],
  analysis: createInitialAnalysis(),
  messages: [],
  suggestions: [],
  exchangeCount: 0,
  isGeneratingCase: false,
  isAttorneyThinking: false,
  isSuggestionsLoading: false,
  outcome: null,
};

export const useArgumentStore = create<ArgumentState & ArgumentActions>((set, get) => ({
  ...initialState,

  // ─── Lifecycle ───

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
      messages: [],
      suggestions: [],
      exchangeCount: 0,
      outcome: null,
      phase: 'intro',
    }),

  setPhase: (phase: GamePhase) => set({ phase }),

  reset: () => set({ ...initialState }),

  // ─── Messages ───

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

  // ─── Agent state updates ───

  updatePoints: (updates: PointUpdate[]) =>
    set((state) => {
      const result = applyPointUpdates(
        state.attorneyPoints,
        state.defendantPoints,
        updates
      );
      const analysis = recalcScores(
        state.analysis,
        result.attorneyPoints,
        result.defendantPoints
      );
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

  // ─── Loading states ───

  setGeneratingCase: (v: boolean) => set({ isGeneratingCase: v }),
  setAttorneyThinking: (v: boolean) => set({ isAttorneyThinking: v }),
  setSuggestionsLoading: (v: boolean) => set({ isSuggestionsLoading: v }),

  // ─── Outcome ───

  setOutcome: (outcome: 'won' | 'lost') => set({ outcome, phase: 'ended' }),

  // ─── Persistence ───

  persist: async () => {
    const state = get();
    const data: ArgumentState = {
      phase: state.phase,
      caseData: state.caseData,
      attorneyPoints: state.attorneyPoints,
      defendantPoints: state.defendantPoints,
      analysis: state.analysis,
      messages: state.messages,
      suggestions: state.suggestions,
      exchangeCount: state.exchangeCount,
      isGeneratingCase: false,
      isAttorneyThinking: false,
      isSuggestionsLoading: false,
      outcome: state.outcome,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ArgumentState;
        set({
          ...data,
          isGeneratingCase: false,
          isAttorneyThinking: false,
          isSuggestionsLoading: false,
        });
      }
    } catch {
      // Ignore hydration errors, start fresh
    }
  },
}));
