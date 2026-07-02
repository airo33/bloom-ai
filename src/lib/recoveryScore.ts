// Recovery Score — a single 0..100 number the user can watch trend over
// time. Pure function of the current store slice, no hooks. Split into
// three transparent sub-scores so the UI can show WHY the number is
// what it is (a bare 62/100 with no breakdown reads like a black box).
//
//   score = 0.50 * pain + 0.30 * consistency + 0.20 * momentum
//
// Pain (50%)        avg pain last 7 days → 100 at 0/10, 0 at 10/10
// Consistency (30%) streak capped at 30, linearly scaled
// Momentum (20%)    last-7-day avg vs previous-7-day avg → 100 if pain
//                   dropped ≥2 points, 50 if flat, 0 if it rose ≥2
//
// Corner cases we deliberately return null (not 0!) for: no plan, no
// logs yet. UI should show "Log a few days to see your score" instead
// of a misleading zero.

import type { JournalLog } from '../types/plan';

export interface RecoveryBreakdown {
  score: number;         // 0..100 rounded to int
  pain: number;          // 0..100
  consistency: number;   // 0..100
  momentum: number;      // 0..100
  /** Average pain over the last 7 logged days (or fewer if not enough logs). */
  avgPainRecent: number;
  /** Number of logs actually used for the pain window. */
  sampleSize: number;
}

/**
 * Compute the recovery score. Returns null when the input isn't rich
 * enough yet (typically < 2 logs).
 */
export function computeRecoveryScore(input: {
  logs: JournalLog[];
  streak: number;
}): RecoveryBreakdown | null {
  const { logs, streak } = input;

  if (!logs || logs.length < 2) return null;

  // Sort by day ascending so slicing is intuitive.
  const sorted = [...logs].sort((a, b) => a.day - b.day);
  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);

  const avgPain = mean(last7.map((l) => l.pain));
  const pain = clamp((10 - avgPain) * 10);

  const consistency = clamp((Math.min(streak, 30) / 30) * 100);

  let momentum: number;
  if (prev7.length === 0) {
    // Not enough history yet — treat as neutral.
    momentum = 50;
  } else {
    const prevAvg = mean(prev7.map((l) => l.pain));
    // delta > 0 = pain dropped = good. Map ±2 to [100, 0], flat = 50.
    const delta = prevAvg - avgPain;
    momentum = clamp(50 + delta * 25);
  }

  const score = Math.round(0.5 * pain + 0.3 * consistency + 0.2 * momentum);

  return {
    score,
    pain: Math.round(pain),
    consistency: Math.round(consistency),
    momentum: Math.round(momentum),
    avgPainRecent: round1(avgPain),
    sampleSize: last7.length,
  };
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function clamp(x: number): number {
  return Math.max(0, Math.min(100, x));
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Categorical label so UI can colour + emote the score.
 * (poor <40, fair 40–59, good 60–79, strong 80+)
 */
export function scoreBand(score: number): 'poor' | 'fair' | 'good' | 'strong' {
  if (score < 40) return 'poor';
  if (score < 60) return 'fair';
  if (score < 80) return 'good';
  return 'strong';
}
