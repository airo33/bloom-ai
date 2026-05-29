// Drives bi-directional sync between Zustand and Supabase for the
// authenticated user. Used as a hook from App.tsx — mounts once at app
// startup and lives for the whole session.
//
// On sign-in: one pull, then subscribe to local store changes and push
// debounced updates.
// On sign-out: tear down the subscriptions.

import { useEffect, useRef } from 'react';
import { useAuth } from './auth';
import { useAppStore } from '../store/useAppStore';
import {
  pullFromCloud,
  pushProfile,
  pushPlan,
  pushJournalEntry,
  pushWaterToday,
  pushCompletionToggle,
} from './sync';
import type { JournalLog } from '../types/plan';

const DEBOUNCE_MS = 800;

function debounce<T extends (...args: never[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function useSyncBootstrap(): void {
  const { user } = useAuth();
  const hydrated = useAppStore((s) => s.hydrated);
  const initialPullDone = useRef(false);

  useEffect(() => {
    if (!hydrated || !user) {
      initialPullDone.current = false;
      return;
    }

    let cancelled = false;

    // 1. Pull cloud state into local on sign-in
    pullFromCloud(user.id)
      .catch((e) => console.warn('[sync] pull failed:', e))
      .finally(() => {
        if (!cancelled) initialPullDone.current = true;
      });

    // 2. Push deltas back. We watch the relevant slices and call a
    //    debounced upsert when they change. zustand subscribe gives us
    //    (newState, previousState) callbacks.
    const userId = user.id;

    const debouncedProfile = debounce(() => {
      pushProfile(userId).catch((e) => console.warn('[sync] profile push:', e));
    }, DEBOUNCE_MS);

    const debouncedPlan = debounce(() => {
      pushPlan(userId).catch((e) => console.warn('[sync] plan push:', e));
    }, DEBOUNCE_MS);

    const debouncedWater = debounce((glasses: number) => {
      pushWaterToday(userId, glasses).catch((e) =>
        console.warn('[sync] water push:', e),
      );
    }, DEBOUNCE_MS);

    const unsubProfile = useAppStore.subscribe((state, prev) => {
      if (!initialPullDone.current) return;
      if (
        state.profile !== prev.profile ||
        state.subscriptionTier !== prev.subscriptionTier ||
        state.notifications !== prev.notifications
      ) {
        debouncedProfile();
      }
    });

    const unsubPlan = useAppStore.subscribe((state, prev) => {
      if (!initialPullDone.current) return;
      if (state.plan !== prev.plan) debouncedPlan();
    });

    const unsubWater = useAppStore.subscribe((state, prev) => {
      if (!initialPullDone.current) return;
      if (state.progress.water !== prev.progress.water) {
        debouncedWater(state.progress.water);
      }
    });

    const unsubLogs = useAppStore.subscribe((state, prev) => {
      if (!initialPullDone.current) return;
      if (state.logs.length > prev.logs.length) {
        const newLog: JournalLog | undefined = state.logs[state.logs.length - 1];
        if (newLog) {
          pushJournalEntry(userId, newLog).catch((e) =>
            console.warn('[sync] journal push:', e),
          );
        }
      }
    });

    const unsubCompletions = useAppStore.subscribe((state, prev) => {
      if (!initialPullDone.current) return;
      const a = new Set(prev.progress.doneExerciseIds);
      const b = new Set(state.progress.doneExerciseIds);
      // Added IDs
      for (const id of b) {
        if (!a.has(id)) {
          pushCompletionToggle(userId, id, true).catch((e) =>
            console.warn('[sync] completion push:', e),
          );
        }
      }
      // Removed IDs
      for (const id of a) {
        if (!b.has(id)) {
          pushCompletionToggle(userId, id, false).catch((e) =>
            console.warn('[sync] completion push:', e),
          );
        }
      }
    });

    return () => {
      cancelled = true;
      unsubProfile();
      unsubPlan();
      unsubWater();
      unsubLogs();
      unsubCompletions();
    };
  }, [hydrated, user]);
}
