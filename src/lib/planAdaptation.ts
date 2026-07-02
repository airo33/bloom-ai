// Adaptive Plan — pure detector that watches the user's recent pain
// trend and decides whether to suggest an adjustment. The UI shows the
// suggestion as a non-intrusive card on Home; when the user accepts we
// hand off to the existing adjust-plan Edge Function with an
// auto-generated adjustment text.
//
// Three trigger patterns:
//   'de_escalate' — 3+ consecutive days with pain ≥6. Something in the
//                   current phase is provoking. Cut intensity.
//   'modify'      — 3-day avg pain is ≥1.5 points HIGHER than the
//                   previous 3-day avg. Trending the wrong way but not
//                   yet severe. Swap exercises for lower-load variants.
//   'progress'    — 7 consecutive days with pain <3 AND streak ≥7.
//                   Time to challenge the tissue more.
//
// We suppress duplicate suggestions using progress.day: the store
// tracks `lastAdaptationSuggestedDay`; if that === today, skip.

import type { JournalLog } from '../types/plan';

export type AdaptationKind = 'de_escalate' | 'modify' | 'progress';

export interface AdaptationSuggestion {
  kind: AdaptationKind;
  /** Human-readable summary used in the Home card + modal ("Pain has
   *  been high for 4 days"). Reads on the user's language. */
  summaryKey: string;
  /** The system-facing adjustment prompt shipped to the adjust-plan
   *  Edge Function so the AI knows what change to make. Always English
   *  because it goes to the LLM, not the user. */
  adjustmentPrompt: string;
  /** Diagnostic numbers surfaced to the user so the suggestion doesn't
   *  feel like a black box. */
  stats: {
    days: number;
    avgPain: number;
  };
}

/**
 * Analyse logs + streak + last-suggestion marker; return a suggestion
 * or null. Callers pass `currentDay` (progress.day) so the "once per
 * day" guard is applied consistently.
 */
export function detectAdaptation(input: {
  logs: JournalLog[];
  streak: number;
  currentDay: number;
  lastSuggestedDay: number;
}): AdaptationSuggestion | null {
  const { logs, streak, currentDay, lastSuggestedDay } = input;
  if (currentDay === lastSuggestedDay) return null;
  if (!logs || logs.length === 0) return null;

  const sorted = [...logs].sort((a, b) => a.day - b.day);
  const last3 = sorted.slice(-3);
  const prev3 = sorted.slice(-6, -3);
  const last7 = sorted.slice(-7);

  // 1. High pain persistent — 3+ consecutive days ≥6
  if (last3.length >= 3 && last3.every((l) => l.pain >= 6)) {
    const days = last3.length;
    const avgPain = mean(last3.map((l) => l.pain));
    return {
      kind: 'de_escalate',
      summaryKey: 'adaptation.detectHighPain',
      adjustmentPrompt: `The patient reports pain of ${avgPain.toFixed(1)}/10 averaged over the last ${days} consecutive days — persistently high. De-escalate the current plan: replace heavier loading exercises with isometric or gentle range-of-motion variants for this phase, reduce total dosage by 25–30%, and extend the current phase by 1 week before progressing. Preserve the phase structure and the injury-appropriate rationale.`,
      stats: { days, avgPain: round1(avgPain) },
    };
  }

  // 2. Trending up — 3-day avg ≥1.5 points higher than previous 3-day avg
  if (last3.length >= 3 && prev3.length >= 3) {
    const nowAvg = mean(last3.map((l) => l.pain));
    const prevAvg = mean(prev3.map((l) => l.pain));
    if (nowAvg - prevAvg >= 1.5) {
      return {
        kind: 'modify',
        summaryKey: 'adaptation.detectTrendingUp',
        adjustmentPrompt: `The patient's pain is trending upward: the last 3 days averaged ${nowAvg.toFixed(1)}/10 vs ${prevAvg.toFixed(1)}/10 the 3 days before. Modify the current plan to swap the most-loading exercises for lower-load or unloaded alternatives (e.g. isometric holds instead of dynamic reps, supported instead of standing). Keep dosage similar but bias toward pain-free ranges. Do not change the overall phase structure.`,
        stats: { days: 3, avgPain: round1(nowAvg) },
      };
    }
  }

  // 3. Sustained low pain — 7 consecutive days <3 AND streak ≥7
  if (last7.length >= 7 && streak >= 7 && last7.every((l) => l.pain < 3)) {
    const avgPain = mean(last7.map((l) => l.pain));
    return {
      kind: 'progress',
      summaryKey: 'adaptation.detectReadyToProgress',
      adjustmentPrompt: `The patient has reported pain <3/10 for 7 consecutive days (avg ${avgPain.toFixed(1)}/10) with a ${streak}-day adherence streak. Progress the plan: advance to the next phase early, or if already at the last phase, upgrade the top 2–3 loading exercises to the next progression (heavier load, longer eccentric, single-limb variant, higher velocity). Keep everything else stable. This is a "green light" progression, not a rebuild.`,
      stats: { days: 7, avgPain: round1(avgPain) },
    };
  }

  return null;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
