// Exercise/task categories — color + emoji tile system (ports `CATS` and `cat()` from prototype).

export type CategoryId =
  | 'exercise'
  | 'physio'
  | 'nutrition'
  | 'rest'
  | 'mobility'
  | 'strength'
  | 'cardio';

export interface CategoryTheme {
  bg: string;      // tile background
  ic: string;      // icon/text color
  bar: string;     // accent bar
  em: string;      // emoji
  lbl: string;     // human-readable label
}

export const CATEGORIES: Record<CategoryId, CategoryTheme> = {
  exercise:  { bg: '#EEE9FF', ic: '#6C5CE7', bar: '#6C5CE7', em: '🏃', lbl: 'Exercise' },
  physio:    { bg: '#E3F2FD', ic: '#0984E3', bar: '#0984E3', em: '🩺', lbl: 'Physio' },
  nutrition: { bg: '#E0F5F0', ic: '#00894A', bar: '#00B894', em: '🥗', lbl: 'Nutrition' },
  rest:      { bg: '#FEF8E8', ic: '#C09000', bar: '#FDCB6E', em: '😴', lbl: 'Rest' },
  mobility:  { bg: '#F3E8FF', ic: '#9333EA', bar: '#9333EA', em: '🤸', lbl: 'Mobility' },
  strength:  { bg: '#FEE2E2', ic: '#DC2626', bar: '#DC2626', em: '💪', lbl: 'Strength' },
  cardio:    { bg: '#ECFDF5', ic: '#059669', bar: '#059669', em: '🚶', lbl: 'Cardio' },
};

export function getCategory(id: string | undefined): CategoryTheme {
  if (id && id in CATEGORIES) return CATEGORIES[id as CategoryId];
  return CATEGORIES.exercise;
}
