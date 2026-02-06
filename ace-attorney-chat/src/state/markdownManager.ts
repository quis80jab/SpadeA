import {
  CaseData,
  CasePoint,
  AnalysisState,
  Message,
  PointUpdate,
  FallacyEntry,
  AssumptionEntry,
} from './types';

// ─── Generators (structured data → markdown strings for agent context) ───

export function generateIssueMd(caseData: CaseData): string {
  return `# ${caseData.title}

## Charge
${caseData.charge}

## Context
${caseData.context}

## The Real Question
${caseData.philosophical_tension}
`;
}

export function generatePointsMd(
  points: CasePoint[],
  side: 'prosecution' | 'defense'
): string {
  const title = side === 'prosecution' ? 'Prosecution Arguments' : 'Defense Arguments';
  const rows = points
    .map((p) => `| ${p.id} | ${p.claim} | ${p.evidence} | ${p.status} |`)
    .join('\n');

  const concessions = points
    .filter((p) => p.status === 'refuted')
    .map((p) => `- ${p.id}: ${p.claim}`)
    .join('\n');

  return `# ${title}

| ID | Claim | Evidence | Status |
|----|-------|----------|--------|
${rows}

## Concessions
${concessions || '- None'}
`;
}

export function generateAnalysisMd(analysis: AnalysisState): string {
  const assumptionRows = analysis.assumptions
    .map((a) => `| ${a.side} | ${a.assumption} | ${a.state} |`)
    .join('\n');

  const fallacyRows = analysis.fallacies
    .map((f) => `| ${f.side} | ${f.type} | ${f.context} | ${f.exchangeNumber} |`)
    .join('\n');

  return `# Argument Analysis

## Key Assumptions
| Side | Assumption | State |
|------|-----------|-------|
${assumptionRows || '| - | - | - |'}

## Fallacies Identified
| Side | Type | Context | Exchange # |
|------|------|---------|-----------|
${fallacyRows || '| - | - | - | - |'}

## Score
- Attorney: ${analysis.attorneyScore.validPoints} valid points, ${analysis.attorneyScore.fallacies} fallacies, ${analysis.attorneyScore.challenged} challenged
- Defendant: ${analysis.defendantScore.validPoints} valid points, ${analysis.defendantScore.fallacies} fallacies, ${analysis.defendantScore.challenged} challenged
`;
}

export function generateConversationMd(messages: Message[]): string {
  if (messages.length === 0) return '# Conversation Log\n\n(No exchanges yet)\n';

  let md = '# Conversation Log\n\n';
  let exchangeNum = 0;
  let lastSender = '';

  for (const msg of messages) {
    if (msg.sender === 'attorney' && lastSender !== 'attorney') {
      exchangeNum++;
      md += `## Exchange ${exchangeNum}\n`;
    }
    const label = msg.sender === 'attorney' ? 'Attorney' : 'User';
    md += `**${label}:** ${msg.text}\n\n`;
    lastSender = msg.sender;
  }

  return md;
}

// ─── Updaters (apply agent outputs to structured data) ───

export function applyPointUpdates(
  attorneyPoints: CasePoint[],
  defendantPoints: CasePoint[],
  updates: PointUpdate[]
): { attorneyPoints: CasePoint[]; defendantPoints: CasePoint[] } {
  const newAttorney = [...attorneyPoints];
  const newDefendant = [...defendantPoints];

  for (const update of updates) {
    const aIdx = newAttorney.findIndex((p) => p.id === update.id);
    if (aIdx >= 0) {
      newAttorney[aIdx] = { ...newAttorney[aIdx], status: update.new_status };
      continue;
    }
    const dIdx = newDefendant.findIndex((p) => p.id === update.id);
    if (dIdx >= 0) {
      newDefendant[dIdx] = { ...newDefendant[dIdx], status: update.new_status };
    }
  }

  return { attorneyPoints: newAttorney, defendantPoints: newDefendant };
}

export function applyFallacies(
  analysis: AnalysisState,
  fallacies: FallacyEntry[],
  exchangeNumber: number
): AnalysisState {
  const newFallacies = [
    ...analysis.fallacies,
    ...fallacies.map((f) => ({ ...f, exchangeNumber })),
  ];

  const attorneyFallacies = newFallacies.filter((f) => f.side === 'attorney').length;
  const defendantFallacies = newFallacies.filter((f) => f.side === 'defendant').length;

  return {
    ...analysis,
    fallacies: newFallacies,
    attorneyScore: { ...analysis.attorneyScore, fallacies: attorneyFallacies },
    defendantScore: { ...analysis.defendantScore, fallacies: defendantFallacies },
  };
}

export function applyAssumptions(
  analysis: AnalysisState,
  assumptions: AssumptionEntry[]
): AnalysisState {
  const newAssumptions = [...analysis.assumptions];

  for (const update of assumptions) {
    const idx = newAssumptions.findIndex(
      (a) => a.side === update.side && a.assumption === update.assumption
    );
    if (idx >= 0) {
      newAssumptions[idx] = { ...newAssumptions[idx], state: update.new_state };
    } else {
      newAssumptions.push({
        side: update.side,
        assumption: update.assumption,
        state: update.new_state,
      });
    }
  }

  return { ...analysis, assumptions: newAssumptions };
}

export function recalcScores(
  analysis: AnalysisState,
  attorneyPoints: CasePoint[],
  defendantPoints: CasePoint[]
): AnalysisState {
  return {
    ...analysis,
    attorneyScore: {
      ...analysis.attorneyScore,
      validPoints: attorneyPoints.filter(
        (p) => p.status === 'unchallenged' || p.status === 'proven'
      ).length,
      challenged: attorneyPoints.filter((p) => p.status === 'challenged').length,
    },
    defendantScore: {
      ...analysis.defendantScore,
      validPoints: defendantPoints.filter(
        (p) => p.status === 'unchallenged' || p.status === 'proven'
      ).length,
      challenged: defendantPoints.filter((p) => p.status === 'challenged').length,
    },
  };
}

// ─── Initial analysis state ───

export function createInitialAnalysis(): AnalysisState {
  return {
    assumptions: [],
    fallacies: [],
    attorneyScore: { validPoints: 0, fallacies: 0, challenged: 0 },
    defendantScore: { validPoints: 0, fallacies: 0, challenged: 0 },
  };
}
