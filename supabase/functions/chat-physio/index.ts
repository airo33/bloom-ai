// supabase/functions/chat-physio/index.ts
//
// AI Physio chat — back-and-forth conversation grounded on the user's plan.
// Uses Claude Haiku 4.5 (fast + cheap) since chat needs quick turnaround.
//
// Input: { plan, history: [{role, content}], userMessage }
// Output: { reply, usage }

import { preflight, json } from '../_shared/cors.ts';
import { callAnthropic, extractText, type MessagePart } from '../_shared/anthropic.ts';

interface RequestBody {
  plan?: unknown;
  history?: MessagePart[];
  userMessage: string;
}

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_HISTORY = 12;

function buildSystem(plan: unknown): string {
  const planSummary = plan
    ? `\n\nThe user is following this rehab plan (JSON):\n${JSON.stringify(plan).slice(0, 4000)}`
    : '';

  return `You are an AI physiotherapy assistant for the RECOVA app. You help the user understand their rehab plan, answer questions about exercises, pain, and progression, and flag when they should see a real clinician.

Be concise (2-4 sentences typical), warm, and clinical. Use plain language. Never diagnose definitively. When user reports red-flag symptoms (severe sudden pain, swelling that won't subside, loss of function, numbness, fever) — explicitly tell them to contact a clinician.${planSummary}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }
  if (!body.userMessage || typeof body.userMessage !== 'string') {
    return json({ error: 'userMessage is required' }, 400);
  }

  // Trim history to the last MAX_HISTORY turns to keep token cost predictable
  const history = (body.history ?? []).slice(-MAX_HISTORY).filter(
    (m): m is MessagePart =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  );

  try {
    const resp = await callAnthropic({
      model: MODEL,
      maxTokens: 600,
      system: buildSystem(body.plan),
      messages: [
        ...history,
        { role: 'user', content: body.userMessage },
      ],
      temperature: 0.6,
    });

    return json({
      reply: extractText(resp),
      usage: resp.usage,
      model: MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
