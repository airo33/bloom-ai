// Mood vocabulary — Lucide-iconified replacement for the emoji picker.
//
// We keep storing the emoji in JournalLog.mood for backward compatibility
// with logs created before the redesign; this map gives us a lookup from
// emoji -> icon so past entries render with the new visual language.

import { Frown, Meh, Smile, Laugh } from 'lucide-react-native';

export interface MoodOption {
  /** Stable id used as the picker key. */
  id: 'bad' | 'meh' | 'ok' | 'good';
  /** Stored value in JournalLog.mood (kept emoji for backward compat). */
  value: string;
  label: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number; fill?: string }>;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'bad',  value: '😔', label: 'Bad',  Icon: Frown },
  { id: 'meh',  value: '😐', label: 'Meh',  Icon: Meh },
  { id: 'ok',   value: '🙂', label: 'Good', Icon: Smile },
  { id: 'good', value: '😄', label: 'Great', Icon: Laugh },
];

/** Find a MoodOption by its stored value (emoji). Falls back to Meh. */
export function moodFor(value: string): MoodOption {
  return MOOD_OPTIONS.find((m) => m.value === value) ?? MOOD_OPTIONS[1];
}
