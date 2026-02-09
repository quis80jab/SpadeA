import { NextRequest, NextResponse } from 'next/server';
import {
  CASE_CREATOR_PROMPT,
  LAWYER_PROMPT,
  LAWYER_SURRENDER_ADDENDUM,
  DEFENDANT_PROMPT,
} from '@/src/agents/prompts';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY ?? '';
  if (!key || key === 'your-api-key-here') {
    throw new Error('ANTHROPIC_API_KEY not configured in .env.local');
  }
  return key;
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error('No JSON object found in agent response');
}

async function callClaude(
  systemPrompt: string,
  userContent: string,
  maxTokens: number = 2048
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent, context, userMessage, exchangeCount, surrender } = body;

    let systemPrompt: string;
    let userContent: string;

    switch (agent) {
      case 'case_creator':
        systemPrompt = CASE_CREATOR_PROMPT;
        userContent = 'Generate a new absurd but philosophically deep court case. Output ONLY the JSON object.';
        break;

      case 'lawyer': {
        systemPrompt = surrender
          ? LAWYER_PROMPT + LAWYER_SURRENDER_ADDENDUM
          : LAWYER_PROMPT;
        userContent = surrender
          ? `${context}\n\nThe defendant has surrendered. Deliver your victory speech.`
          : `${context}\n\nThe defendant just said: "${userMessage}"\n\nRespond as the prosecuting attorney. Output ONLY the JSON object.`;
        break;
      }

      case 'defendant': {
        systemPrompt = DEFENDANT_PROMPT;
        userContent = `${context}\n\nExchange count: ${exchangeCount}\n\nGenerate contextual suggested replies for the defendant. ${
          exchangeCount >= 6
            ? 'IMPORTANT: Include a surrender option as the last suggestion since we are past 6 exchanges.'
            : ''
        }\n\nOutput ONLY the JSON object.`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown agent type' }, { status: 400 });
    }

    const raw = await callClaude(systemPrompt, userContent);
    const json = extractJSON(raw);

    return NextResponse.json({ result: json });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Agent API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
