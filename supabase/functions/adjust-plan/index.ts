// supabase/functions/adjust-plan/index.ts
//
// Regenerates an existing rehab plan with a user-supplied tweak request,
// e.g. "no pool exercises, no equipment", "make week 1 lighter", "I
// don't have a foam roller". Reuses the senior-physio persona from
// generate-plan but conditions on the existing plan and the adjustment
// note instead of a fresh injury description.

import { preflight, json } from '../_shared/cors.ts';
import { callLLM, parseJsonFromLLM, PLAN_MODEL, FALLBACK_MODEL } from '../_shared/llm.ts';

interface RequestBody {
  plan: unknown;     // existing RehabPlan
  injury?: string;   // original injury description (for grounding)
  adjustment: string; // user's "what to change" note
  name?: string;
  age?: string | number;
  fitnessLevel?: string;
  /** ISO 639-1 code: 'en', 'es', 'pt', 'de'. Falls back to English. */
  language?: string;
}

// Same model as generate-plan (configurable via GROQ_PLAN_MODEL, with
// automatic fallback to FALLBACK_MODEL if it's decommissioned).
const MODEL = PLAN_MODEL;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Brazilian Portuguese',
  de: 'German',
};

function languageDirective(code?: string): string {
  const c = (code ?? 'en').toLowerCase().slice(0, 2);
  if (c === 'en') return '';
  const name = LANGUAGE_NAMES[c] ?? 'English';
  return `\n\nIMPORTANT: Respond entirely in ${name}. EVERY string value in the JSON — title, summary, clinicalGoals, redFlags, phase names, goals, exercise names, steps, clinicalRationale, benefit, warning, redFlag, tips, and the off_topic message — must be written in ${name}. Do not use English anywhere except for the JSON keys themselves.`;
}

const SYSTEM_PROMPT = `You are a senior physiotherapist adjusting an existing rehab plan for a returning patient. The patient already has a plan and is telling you what to change. Apply their request while keeping the protocol safe, evidence-based, and consistent with the injury they originally described.

Rules:
- Keep the same JSON schema as the original plan
- Honour their adjustment (e.g. remove an exercise, swap equipment, scale intensity)
- If they ask to remove ALL exercises in a category, replace with safe equivalents
- If their adjustment would make the plan unsafe, ignore it and keep the safer version
- If the adjustment is unrelated to physiotherapy (e.g. "make it about cooking"), return an error JSON: { "error": "off_topic", "message": "..." }
- Output a single JSON object, no markdown fences, no commentary`;

function buildPrompt(body: RequestBody): string {
  const name = body.name?.trim() || 'Patient';
  const age = body.age || '?';
  const level = body.fitnessLevel || 'moderate';
  const injury = (body.injury || '').trim();
  const adjustment = body.adjustment.trim();

  return `PATIENT
- Name: ${name}, ${age}yo, fitness: ${level}
- Original injury: "${injury || 'as documented in the existing plan'}"

EXISTING PLAN (JSON):
${JSON.stringify(body.plan).slice(0, 6000)}

PATIENT'S ADJUSTMENT REQUEST:
"${adjustment}"

YOUR TASK
Produce a NEW JSON plan matching the SAME schema as the existing one (title, totalWeeks, summary, clinicalGoals, redFlags, exercises[], phases[], tips). Apply the patient's adjustment. Keep injury-appropriate exercises and phase progression. If the adjustment is off-topic for physiotherapy, return:
{
  "error": "off_topic",
  "message": "<short sentence asking them to describe the change in terms of their recovery>"
}`;
}

function planQualityIssues(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object') return ['not an object'];
  const p = obj as Record<string, unknown>;
  const issues: string[] = [];
  if (typeof p.title !== 'string') issues.push('missing title');
  if (!Array.isArray(p.exercises) || p.exercises.length < 4) issues.push('too few exercises');
  if (!Array.isArray(p.phases) || p.phases.length < 2) issues.push('too few phases');
  return issues;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }
  if (!body.plan || !body.adjustment || body.adjustment.trim().length < 3) {
    return json({ error: 'plan and adjustment are required' }, 400);
  }

  try {
    const resp = await callLLM({
      model: MODEL,
      fallbackModels: [FALLBACK_MODEL],
      maxTokens: 6000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + languageDirective(body.language) },
        { role: 'user', content: buildPrompt(body) },
      ],
      temperature: 0.4,
      jsonMode: true,
    });

    const parsed = parseJsonFromLLM(resp.text);

    if (
      parsed &&
      typeof parsed === 'object' &&
      'error' in parsed &&
      (parsed as { error: unknown }).error === 'off_topic'
    ) {
      const message = ((parsed as { message?: unknown }).message ?? '').toString();
      return json({ error: 'off_topic', message }, 400);
    }

    const issues = planQualityIssues(parsed);
    if (issues.length > 0) {
      return json({ error: 'AI returned a low-quality plan', issues }, 502);
    }

    return json({ plan: parsed, usage: resp.usage, model: MODEL });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
