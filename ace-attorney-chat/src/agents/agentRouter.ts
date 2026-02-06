import Constants from 'expo-constants';
import {
  CASE_CREATOR_PROMPT,
  LAWYER_PROMPT,
  LAWYER_SURRENDER_ADDENDUM,
  DEFENDANT_PROMPT,
} from './prompts';
import {
  generateIssueMd,
  generatePointsMd,
  generateAnalysisMd,
  generateConversationMd,
} from '../state/markdownManager';
import { useArgumentStore } from '../state/argumentStore';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.anthropicApiKey
    ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
    ?? '';
  if (!key || key === 'your-api-key-here') {
    throw new Error(
      'ANTHROPIC_API_KEY not configured. Set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file.'
    );
  }
  return key;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  maxTokens: number = 2048
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? '';
  return content;
}

function extractJSON(text: string): string {
  // Try to find JSON in the response (handles cases where model adds commentary)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error('No JSON object found in agent response');
}

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

// ─── Agent Callers ───

export async function callCaseCreator(): Promise<string> {
  const raw = await callClaude(CASE_CREATOR_PROMPT, [
    {
      role: 'user',
      content:
        'Generate a new absurd but philosophically deep court case. Output ONLY the JSON object.',
    },
  ]);
  return extractJSON(raw);
}

export async function callLawyer(
  userMessage: string,
  surrender: boolean = false
): Promise<string> {
  const context = buildContext();
  const systemPrompt = surrender
    ? LAWYER_PROMPT + LAWYER_SURRENDER_ADDENDUM
    : LAWYER_PROMPT;

  const prompt = surrender
    ? `${context}\n\nThe defendant has surrendered. Deliver your victory speech.`
    : `${context}\n\nThe defendant just said: "${userMessage}"\n\nRespond as the prosecuting attorney. Output ONLY the JSON object.`;

  const raw = await callClaude(systemPrompt, [{ role: 'user', content: prompt }]);
  return extractJSON(raw);
}

export async function callDefendant(exchangeCount: number): Promise<string> {
  const context = buildContext();
  const prompt = `${context}\n\nExchange count: ${exchangeCount}\n\nGenerate contextual suggested replies for the defendant. ${
    exchangeCount >= 6
      ? 'IMPORTANT: Include a surrender option as the last suggestion since we are past 6 exchanges.'
      : ''
  }\n\nOutput ONLY the JSON object.`;

  const raw = await callClaude(DEFENDANT_PROMPT, [{ role: 'user', content: prompt }]);
  return extractJSON(raw);
}
