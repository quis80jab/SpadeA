// ─── Case Creator Output ───

export interface CasePoint {
  id: string;
  claim: string;
  evidence: string;
  status: 'unchallenged' | 'challenged' | 'refuted' | 'proven';
}

export interface CaseData {
  title: string;
  charge: string;
  context: string;
  philosophical_tension: string;
  attorney_points: CasePoint[];
  defendant_points: CasePoint[];
  opening_statement: string;
}

// ─── Lawyer Agent Output ───

export interface PointUpdate {
  id: string;
  new_status: CasePoint['status'];
  reason: string;
}

export interface FallacyEntry {
  side: 'attorney' | 'defendant';
  type: string;
  context: string;
}

export interface AssumptionEntry {
  side: 'attorney' | 'defendant';
  assumption: string;
  new_state: 'HELD' | 'CHALLENGED' | 'BROKEN';
}

export interface LawyerResponse {
  message: string;
  updated_points: PointUpdate[];
  fallacies_identified: FallacyEntry[];
  assumptions_challenged: AssumptionEntry[];
  intensity_level: number;
}

// ─── Defendant Agent Output ───

export type SuggestionType = 'objection' | 'evidence' | 'dramatic' | 'strategic' | 'surrender';
export type SuggestionVariant = 'default' | 'surrender';

export interface SuggestedReply {
  text: string;
  type: SuggestionType;
  variant: SuggestionVariant;
}

export interface DefendantResponse {
  suggestions: SuggestedReply[];
  defense_analysis: string;
  recommended_strategy: string;
}

// ─── Chat Message ───

export interface Message {
  id: string;
  text: string;
  sender: 'attorney' | 'user';
  timestamp: number;
  intensity?: number;
}

// ─── Analysis State ───

export interface AnalysisAssumption {
  side: 'attorney' | 'defendant';
  assumption: string;
  state: 'HELD' | 'CHALLENGED' | 'BROKEN';
}

export interface AnalysisFallacy {
  side: 'attorney' | 'defendant';
  type: string;
  context: string;
  exchangeNumber: number;
}

export interface AnalysisState {
  assumptions: AnalysisAssumption[];
  fallacies: AnalysisFallacy[];
  attorneyScore: { validPoints: number; fallacies: number; challenged: number };
  defendantScore: { validPoints: number; fallacies: number; challenged: number };
}

// ─── App State ───

export type GamePhase = 'splash' | 'generating' | 'intro' | 'chat' | 'surrender' | 'ended';

export interface ArgumentState {
  // Game phase
  phase: GamePhase;

  // Case data
  caseData: CaseData | null;
  attorneyPoints: CasePoint[];
  defendantPoints: CasePoint[];
  analysis: AnalysisState;

  // Chat
  messages: Message[];
  suggestions: SuggestedReply[];
  exchangeCount: number;

  // Loading states
  isGeneratingCase: boolean;
  isAttorneyThinking: boolean;
  isSuggestionsLoading: boolean;

  // Outcome
  outcome: 'pending' | 'won' | 'lost' | null;
}
