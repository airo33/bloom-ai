// Domain types for the AI-generated rehab plan.
// Mirrors the JSON schema specified in the prototype's `genPlan` prompt.

import type { CategoryId } from '../theme/categories';

export type WeekdayShort = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type ExerciseLevel = 'Easy' | 'Moderate' | 'Hard';

export interface Exercise {
  id: string;
  name: string;
  category: CategoryId;
  emoji?: string;
  time?: string;            // "10 min"
  dosage?: string;          // "3 sets × 12 reps"
  reps?: string;            // legacy alias
  tempo?: string;           // "2s/1s/3s"
  level?: ExerciseLevel;
  steps: string[];
  clinicalRationale: string;
  benefit: string;
  warning: string;
  redFlag: string;
}

export interface PlanPhase {
  name: string;
  weekNumbers?: string;     // "1-2"
  weeks?: string;           // legacy alias
  goals?: string[];
  progressionCriteria?: string;
  weekdays: Partial<Record<WeekdayShort, string[]>>; // exercise IDs per day
}

export interface RehabPlan {
  title: string;
  totalWeeks: number;
  summary: string;
  clinicalGoals: string[];
  redFlags: string[];
  exercises: Exercise[];
  phases: PlanPhase[];
  tips?: string[];
}

// Daily journal entry
export interface JournalLog {
  day: number;                // recovery day number (1-based)
  date: string;               // ISO yyyy-mm-dd
  pain: number;               // 0-10
  mood: string;               // emoji
  water: number;              // glasses 0-8
  notes?: string;
  createdAt: string;          // ISO
}

export type SubscriptionTier = 'weekly' | 'monthly' | 'annual' | 'trial' | null;

export type FitnessLevel = 'Sedentary' | 'Moderate' | 'Athletic';
