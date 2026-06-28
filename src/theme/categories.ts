// Exercise/task categories — Garden retint.
//
// Bright saturated hues replaced with tonal natural surfaces so the
// tiles sit calmly on the warm cream / olive-black backgrounds. Each
// category gets a dark + light variant so the call site can ask the
// theme which scheme is active and pick the matching pair.

import type { ColorScheme } from './colors';

export type CategoryId =
  | 'exercise'
  | 'physio'
  | 'nutrition'
  | 'rest'
  | 'mobility'
  | 'strength'
  | 'cardio';

export interface CategoryTheme {
  /** Tile background colour */
  bg: string;
  /** Icon / accent colour on that tile */
  ic: string;
  /** Hero header bar fill (used in ExerciseScreen) */
  bar: string;
  /** Decorative emoji — kept for backwards compat. Garden prefers the
   *  matching lucide icon at the call site instead. */
  em: string;
  /** Human-readable label */
  lbl: string;
}

interface CategoryPair {
  light: Pick<CategoryTheme, 'bg' | 'ic' | 'bar'>;
  dark: Pick<CategoryTheme, 'bg' | 'ic' | 'bar'>;
  em: string;
  lbl: string;
}

const PAIRS: Record<CategoryId, CategoryPair> = {
  mobility: {
    light: { bg: '#EDF3E2', ic: '#5F9437', bar: '#5F9437' },
    dark:  { bg: '#2A3320', ic: '#BFE39A', bar: '#BFE39A' },
    em: '🤸', lbl: 'Mobility',
  },
  strength: {
    light: { bg: '#F6EBE1', ic: '#B3733F', bar: '#B3733F' },
    dark:  { bg: '#332420', ic: '#E8A87C', bar: '#E8A87C' },
    em: '💪', lbl: 'Strength',
  },
  cardio: {
    light: { bg: '#E4F2EB', ic: '#4A9A7C', bar: '#4A9A7C' },
    dark:  { bg: '#20302C', ic: '#88C8A8', bar: '#88C8A8' },
    em: '🚶', lbl: 'Cardio',
  },
  physio: {
    light: { bg: '#E7F1F8', ic: '#2E93B8', bar: '#2E93B8' },
    dark:  { bg: '#102030', ic: '#7FC6E0', bar: '#7FC6E0' },
    em: '🩺', lbl: 'Physio',
  },
  rest: {
    light: { bg: '#F5F0D8', ic: '#A98F2E', bar: '#A98F2E' },
    dark:  { bg: '#2A2A18', ic: '#D8C97A', bar: '#D8C97A' },
    em: '😴', lbl: 'Rest',
  },
  // Older fallback categories — map to the closest Garden tone.
  exercise: {
    light: { bg: '#EDF3E2', ic: '#5F9437', bar: '#5F9437' },
    dark:  { bg: '#2A3320', ic: '#BFE39A', bar: '#BFE39A' },
    em: '🏃', lbl: 'Exercise',
  },
  nutrition: {
    light: { bg: '#E4F2EB', ic: '#4A9A7C', bar: '#4A9A7C' },
    dark:  { bg: '#20302C', ic: '#88C8A8', bar: '#88C8A8' },
    em: '🥗', lbl: 'Nutrition',
  },
};

/**
 * Build the default (light) CategoryTheme map for backwards compat with
 * call sites that import CATEGORIES directly. New code should prefer
 * `getCategoryFor(id, theme.scheme)`.
 */
export const CATEGORIES: Record<CategoryId, CategoryTheme> = Object.fromEntries(
  (Object.keys(PAIRS) as CategoryId[]).map((id) => {
    const p = PAIRS[id];
    return [id, { ...p.light, em: p.em, lbl: p.lbl }];
  }),
) as Record<CategoryId, CategoryTheme>;

export function getCategory(id: string | undefined): CategoryTheme {
  if (id && id in CATEGORIES) return CATEGORIES[id as CategoryId];
  return CATEGORIES.exercise;
}

/**
 * Scheme-aware variant. Use this from any component that already has
 * `useTheme()` available so the tiles pick the right tone for light vs.
 * dark mode.
 */
export function getCategoryFor(
  id: string | undefined,
  scheme: ColorScheme,
): CategoryTheme {
  const key: CategoryId =
    id && id in PAIRS ? (id as CategoryId) : 'exercise';
  const p = PAIRS[key];
  const tones = scheme === 'dark' ? p.dark : p.light;
  return { ...tones, em: p.em, lbl: p.lbl };
}
