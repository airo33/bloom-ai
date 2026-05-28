// supabase/functions/generate-plan/index.ts
//
// Generates a personalized rehab plan via Claude Sonnet 4.6.
// Input: { name, age, fitnessLevel, injury }
// Output: a RehabPlan JSON matching src/types/plan.ts

import { preflight, json } from '../_shared/cors.ts';
import {
  callAnthropic,
  extractText,
  parseJsonFromLLM,
} from '../_shared/anthropic.ts';

interface RequestBody {
  name?: string;
  age?: string | number;
  fitnessLevel?: string;
  injury: string;
}

const MODEL = 'claude-sonnet-4-6';

function buildPrompt(body: RequestBody): string {
  const name = body.name?.trim() || 'Patient';
  const age = body.age || '?';
  const level = body.fitnessLevel || 'moderate';
  const injury = body.injury.trim();

  return `You are a senior physiotherapist (20+ years). Create a TRULY PERSONALIZED rehabilitation protocol for this specific injury.

Patient: ${name}, ${age}yo, pre-injury fitness: ${level}
Condition: "${injury}"

CRITICAL REQUIREMENTS:
1. Exercises must be SPECIFIC to THIS injury (ACL needs completely different exercises than shoulder or back)
2. Create 8-10 DIFFERENT exercises in the pool
3. Different exercises for DIFFERENT days of the week (Mon is not same as Tue)
4. Full session days (Mon/Wed/Fri): 4-5 exercises
5. Light days (Tue/Thu): 2-3 exercises
6. Recovery days (Sat/Sun): 1-2 restorative exercises
7. Use real physio exercise names (e.g. "Terminal Knee Extension", "VMO Squats 0-45°", "McGill Bird Dog")
8. Each phase has PROGRESSIVELY harder weekday schedules

Reply ONLY with valid JSON, no markdown fences, no commentary:
{
  "title": "Specific Protocol Name for THIS injury",
  "totalWeeks": number,
  "summary": "4 sentences specific to this exact injury — why these exercises, what tissue is healing, prognosis",
  "clinicalGoals": ["Measurable goal 1", "goal 2", "goal 3"],
  "redFlags": ["Specific warning 1", "warning 2", "warning 3", "warning 4"],
  "exercises": [
    {
      "id": "ex1",
      "name": "Specific exercise name",
      "category": "exercise|physio|nutrition|rest|mobility|strength|cardio",
      "emoji": "🏃",
      "time": "X min",
      "dosage": "X sets × Y reps",
      "tempo": "Xs/Xs/Xs",
      "level": "Easy|Moderate|Hard",
      "steps": ["Position: exact", "Movement: exact", "End range: what correct looks like", "Return: how", "Key cue: most important point"],
      "clinicalRationale": "Why this for this exact injury — tissue and biological process",
      "benefit": "Mechanism how this helps THIS injury",
      "warning": "Specific contraindication",
      "redFlag": "Seek care if: specific symptom"
    }
  ],
  "phases": [
    {
      "name": "Phase name",
      "weekNumbers": "1-2",
      "goals": ["measurable goal"],
      "progressionCriteria": "Advance when: specific criteria",
      "weekdays": {
        "Mon": ["ex1", "ex2", "ex3", "ex4"],
        "Tue": ["ex1", "ex5"],
        "Wed": ["ex2", "ex3", "ex4", "ex6"],
        "Thu": ["ex5", "ex7"],
        "Fri": ["ex1", "ex2", "ex3", "ex4"],
        "Sat": ["ex7", "ex8"],
        "Sun": ["ex8"]
      }
    }
  ],
  "tips": ["evidence-based tip"]
}

REQUIREMENTS:
- 4 phases total
- 8-10 exercises total
- 3 evidence-based tips
- 4 red flags
- 3 clinical goals
- Phase weekday schedules must DIFFER from each other
- ALL content specific to the described injury`;
}

function isPlausiblePlan(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.title === 'string' &&
    typeof p.summary === 'string' &&
    Array.isArray(p.exercises) &&
    Array.isArray(p.phases) &&
    p.exercises.length > 0 &&
    p.phases.length > 0
  );
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
  if (!body.injury || typeof body.injury !== 'string' || body.injury.trim().length < 5) {
    return json({ error: 'injury description is required (min 5 chars)' }, 400);
  }

  try {
    const resp = await callAnthropic({
      model: MODEL,
      maxTokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(body) }],
      temperature: 0.7,
    });

    const text = extractText(resp);
    const parsed = parseJsonFromLLM(text);

    if (!isPlausiblePlan(parsed)) {
      return json(
        { error: 'AI returned a malformed plan', raw: text.slice(0, 800) },
        502,
      );
    }

    return json({
      plan: parsed,
      usage: resp.usage,
      model: MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
