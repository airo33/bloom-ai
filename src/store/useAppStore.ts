// Global app state ported from the prototype's `S` object.
// Persisted to AsyncStorage via Zustand persist middleware.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  RehabPlan,
  Exercise,
  JournalLog,
  SubscriptionTier,
  FitnessLevel,
} from '../types/plan';

interface NotifPrefs {
  exercise: boolean;
  water: boolean;
  journal: boolean;
}

interface UserProfile {
  name: string;
  age: string;
  fitnessLevel: FitnessLevel | '';
  injury: string;
}

interface ProgressState {
  day: number;             // current recovery day (1-based)
  streak: number;          // consecutive log days
  doneExerciseIds: string[]; // ids completed *today*
  water: number;           // glasses today 0-8
  waterHistory: { date: string; glasses: number }[];
  selectedDayIndex: number;
  weekOffset: number;
  lastResetDate: string | null; // ISO yyyy-mm-dd of last daily reset
}

interface AppState {
  // Hydration / boot
  hydrated: boolean;

  // Profile + injury
  profile: UserProfile;

  // Plan + exercises
  plan: RehabPlan | null;

  // Daily progress
  progress: ProgressState;

  // Logs
  logs: JournalLog[];

  // Subscription
  subscriptionTier: SubscriptionTier;

  // Chat history (ephemeral, but persisted so users can scroll back)
  chatHistory: { role: 'user' | 'assistant'; content: string; ts: number }[];

  // Notifications
  notifications: NotifPrefs;

  // -- actions --
  setProfile: (patch: Partial<UserProfile>) => void;
  setPlan: (plan: RehabPlan | null) => void;
  setSubscription: (tier: SubscriptionTier) => void;
  toggleExerciseDone: (id: string) => void;
  setWater: (n: number) => void;
  addWaterGlass: () => void;
  addLog: (log: Omit<JournalLog, 'createdAt'>) => void;
  setNotificationPref: (key: keyof NotifPrefs, value: boolean) => void;
  setSelectedDay: (idx: number) => void;
  setWeekOffset: (off: number) => void;
  advanceDay: () => void;          // call once per calendar day
  resetAll: () => void;
  clearUserData: () => void;       // sign-out cleanup
  appendChat: (role: 'user' | 'assistant', content: string) => void;
  clearChat: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialProfile: UserProfile = {
  name: '',
  age: '',
  fitnessLevel: '',
  injury: '',
};

const initialProgress: ProgressState = {
  day: 1,
  streak: 1,
  doneExerciseIds: [],
  water: 0,
  waterHistory: [],
  selectedDayIndex: 0,
  weekOffset: 0,
  lastResetDate: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: initialProfile,
      plan: null,
      progress: initialProgress,
      logs: [],
      subscriptionTier: null,
      chatHistory: [],
      notifications: { exercise: false, water: false, journal: false },

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      setPlan: (plan) => set({ plan }),

      setSubscription: (tier) =>
        set((s) => {
          // If the user already had a tier, this is an upgrade/change —
          // preserve recovery progress (day, streak, water, logs). The
          // initial-progress reset was always a no-op anyway because the
          // user is at day 1 on first subscribe, so we get the same
          // outcome without trampling later state.
          if (s.subscriptionTier) return { subscriptionTier: tier };
          return {
            subscriptionTier: tier,
            progress: { ...initialProgress, lastResetDate: todayISO() },
          };
        }),

      toggleExerciseDone: (id) =>
        set((s) => {
          const has = s.progress.doneExerciseIds.includes(id);
          return {
            progress: {
              ...s.progress,
              doneExerciseIds: has
                ? s.progress.doneExerciseIds.filter((x) => x !== id)
                : [...s.progress.doneExerciseIds, id],
            },
          };
        }),

      setWater: (n) =>
        set((s) => ({
          progress: { ...s.progress, water: Math.max(0, Math.min(8, n)) },
        })),

      addWaterGlass: () =>
        set((s) => ({
          progress: {
            ...s.progress,
            water: Math.min(8, s.progress.water + 1),
          },
        })),

      addLog: (log) =>
        set((s) => ({
          logs: [...s.logs, { ...log, createdAt: new Date().toISOString() }],
        })),

      setNotificationPref: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),

      setSelectedDay: (idx) =>
        set((s) => ({ progress: { ...s.progress, selectedDayIndex: idx } })),

      setWeekOffset: (off) =>
        set((s) => ({ progress: { ...s.progress, weekOffset: off } })),

      advanceDay: () =>
        set((s) => {
          const today = todayISO();
          if (s.progress.lastResetDate === today) return s;
          const previousDate = s.progress.lastResetDate;

          // First-ever launch: there's no previous date to advance from,
          // so today IS day 1 (or whatever day they're on). Just stamp
          // the reset marker without incrementing.
          if (!previousDate) {
            return {
              progress: {
                ...s.progress,
                lastResetDate: today,
              },
            };
          }

          // Streak: +1 if the previous calendar day, otherwise reset to 1
          const prev = new Date(previousDate);
          const diff = Math.round(
            (Date.parse(today) - prev.getTime()) / 86400000,
          );
          const nextStreak = diff === 1 ? s.progress.streak + 1 : 1;

          return {
            progress: {
              ...s.progress,
              day: s.progress.day + 1,
              streak: nextStreak,
              doneExerciseIds: [],
              water: 0,
              waterHistory: [
                ...s.progress.waterHistory.slice(-29),
                { date: previousDate, glasses: s.progress.water },
              ],
              lastResetDate: today,
            },
          };
        }),

      resetAll: () =>
        set({
          profile: initialProfile,
          plan: null,
          progress: initialProgress,
          logs: [],
          subscriptionTier: null,
          chatHistory: [],
          notifications: { exercise: false, water: false, journal: false },
        }),

      // Sign-out cleanup: drop everything that's user-specific so the next
      // user doesn't see the previous user's data while the cloud pull
      // runs. We keep notification PREFERENCE booleans alone since the
      // notification system is responsible for cancelling its own scheduled
      // entries on sign-out (see ProfileScreen).
      clearUserData: () =>
        set({
          profile: initialProfile,
          plan: null,
          progress: initialProgress,
          logs: [],
          subscriptionTier: null,
          chatHistory: [],
        }),

      appendChat: (role, content) =>
        set((s) => ({
          chatHistory: [...s.chatHistory, { role, content, ts: Date.now() }],
        })),

      clearChat: () => set({ chatHistory: [] }),
    }),
    {
      name: '@recova/app-state',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({
        profile: s.profile,
        plan: s.plan,
        progress: s.progress,
        logs: s.logs,
        subscriptionTier: s.subscriptionTier,
        chatHistory: s.chatHistory,
        notifications: s.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// Convenience selectors
export const selectTodayExercises = (state: AppState): Exercise[] => {
  const { plan, progress } = state;
  if (!plan || !plan.phases?.length || !plan.exercises?.length) return [];
  // Find current phase by recovery day
  let acc = 0;
  let currentPhase = plan.phases[plan.phases.length - 1];
  for (let i = 0; i < plan.phases.length; i++) {
    const ph = plan.phases[i];
    const wn = ph.weekNumbers || ph.weeks || '1-2';
    const parts = wn.split('-');
    const w1 = parseInt(parts[0], 10) || 1;
    const w2 = parseInt(parts[1], 10) || w1 + 1;
    acc += (w2 - w1 + 1) * 7;
    if (progress.day <= acc) {
      currentPhase = ph;
      break;
    }
  }
  const days: Array<keyof typeof currentPhase.weekdays> = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
  ];
  const todayName = days[new Date().getDay()];
  const ids = currentPhase.weekdays?.[todayName] ?? [];
  return ids
    .map((id) => plan.exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e));
};
