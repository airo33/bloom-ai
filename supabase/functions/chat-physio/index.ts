// supabase/functions/chat-physio/index.ts
//
// AI Physio chat — short back-and-forth conversation grounded on the user's
// plan. Uses Llama 3.1 8B Instant on Groq for low-latency chat.

import { preflight, json } from '../_shared/cors.ts';
import { callLLM, type MessagePart } from '../_shared/llm.ts';

interface RequestBody {
  plan?: unknown;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}

// Llama 3.1 8B Instant — Groq's fastest model. Good enough for short
// clinical Q&A grounded on the plan; swap to llama-3.3-70b-versatile if
// quality becomes an issue.
const MODEL = 'llama-3.1-8b-instant';
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

  const history: MessagePart[] = (body.history ?? [])
    .slice(-MAX_HISTORY)
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    );

  try {
    const resp = await callLLM({
      model: MODEL,
      maxTokens: 600,
      messages: [
        { role: 'system', content: buildSystem(body.plan) },
        ...history,
        { role: 'user', content: body.userMessage },
      ],
      temperature: 0.6,
    });

    return json({
      reply: resp.text,
      usage: resp.usage,
      model: MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
