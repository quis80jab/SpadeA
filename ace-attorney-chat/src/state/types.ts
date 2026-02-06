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
  damage_to_attorney: number;
  damage_to_defendant: number;
}

// ─── Health State ───

export interface HealthState {
  attorneyHP: number;
  defendantHP: number;
  maxHP: number;
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

export type GamePhase = 'splash' | 'generating' | 'intro' | 'chat' | 'surrender' | 'victory' | 'ended';

export interface ArgumentState {
  phase: GamePhase;
  caseData: CaseData | null;
  attorneyPoints: CasePoint[];
  defendantPoints: CasePoint[];
  analysis: AnalysisState;
  health: HealthState;
  messages: Message[];
  suggestions: SuggestedReply[];
  exchangeCount: number;
  isGeneratingCase: boolean;
  isAttorneyThinking: boolean;
  isSuggestionsLoading: boolean;
  outcome: 'pending' | 'won' | 'lost' | null;
}

// ─── Saved Argument (history) ───

export interface SavedArgument {
  id: string;
  caseData: CaseData;
  messages: Message[];
  outcome: 'won' | 'lost' | 'in-progress';
  finalHealth: HealthState;
  exchangeCount: number;
  createdAt: number;
  starred: boolean;
}
