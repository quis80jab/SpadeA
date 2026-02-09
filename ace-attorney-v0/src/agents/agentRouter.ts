import {
  generateIssueMd,
  generatePointsMd,
  generateAnalysisMd,
  generateConversationMd,
} from '@/src/state/markdownManager';
import { useArgumentStore } from '@/src/state/argumentStore';

// ─── Build context string from current store state ───

function buildContext(): string {
  const state = useArgumentStore.getState();
  const parts: string[] = [];

  if (state.caseData) {
    parts.push('=== issue.md ===');
    parts.push(generateIssueMd(state.caseData));
  }
  if (state.attorneyPoints.length > 0) {
    parts.push('=== attorney_points.md ===');
    parts.push(generatePointsMd(state.attorneyPoints, 'prosecution'));
  }
  if (state.defendantPoints.length > 0) {
    parts.push('=== defendant_points.md ===');
    parts.push(generatePointsMd(state.defendantPoints, 'defense'));
  }
  if (state.messages.length > 0) {
    parts.push('=== conversation.md ===');
    parts.push(generateConversationMd(state.messages));
  }
  parts.push('=== analysis.md ===');
  parts.push(generateAnalysisMd(state.analysis));

  return parts.join('\n\n');
}

// ─── Call server-side API route ───

async function callAgentAPI(body: Record<string, unknown>): Promise<string> {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `API error (${response.status})`);
  }

  const data = await response.json();
  return data.result;
}

// ─── Agent Callers ───

export async function callCaseCreator(): Promise<string> {
  return callAgentAPI({ agent: 'case_creator' });
}

export async function callLawyer(
  userMessage: string,
  surrender: boolean = false
): Promise<string> {
  const context = buildContext();
  return callAgentAPI({
    agent: 'lawyer',
    context,
    userMessage,
    surrender,
  });
}

export async function callDefendant(exchangeCount: number): Promise<string> {
  const context = buildContext();
  return callAgentAPI({
    agent: 'defendant',
    context,
    exchangeCount,
  });
}
