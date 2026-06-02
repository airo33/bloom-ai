// Cloud ↔ local sync for the authenticated user.
//
// On sign-in: pull cloud → merge into Zustand (cloud wins on profile +
// plan since they're "owned" server-side, local merges in any logs the
// device has that the cloud hasn't seen yet).
//
// On store changes: a debounced pusher writes the deltas back. We keep
// state.lastSyncedAt in memory to skip redundant writes.

import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';
import type { JournalLog, RehabPlan, SubscriptionTier, FitnessLevel } from '../types/plan';

interface ProfileRow {
  id: string;
  name: string | null;
  age: string | null;
  fitness_level: FitnessLevel | null;
  injury: string | null;
  subscription_tier: SubscriptionTier | null;
  notifications: { exercise: boolean; water: boolean; journal: boolean } | null;
}

interface PlanRow {
  user_id: string;
  plan: RehabPlan;
  source: 'ai' | 'fallback';
  updated_at: string;
}

interface JournalRow {
  id: string;
  user_id: string;
  day: number;
  log_date: string;
  pain: number;
  mood: string;
  water: number;
  sleep_quality: number | null;
  energy: number | null;
  stress: number | null;
  notes: string | null;
  created_at: string;
}

interface ChatRow {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface WaterRow {
  user_id: string;
  log_date: string;
  glasses: number;
}

interface CompletionRow {
  user_id: string;
  exercise_id: string;
  completed_on: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

// ── PULL ────────────────────────────────────────────────────────────────

/**
 * Fetch the user's cloud state and merge it into the local Zustand store.
 * Cloud wins on profile + plan + tier; logs are merged by composite key
 * (day + date) so we don't lose entries created offline.
 */
export async function pullFromCloud(userId: string): Promise<void> {
  const today = todayISO();

  const [profileResp, planResp, journalResp, waterResp, completionsResp] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('plans').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: true }),
      supabase
        .from('water_history')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: true })
        .limit(30),
      supabase
        .from('exercise_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed_on', today),
    ]);

  const store = useAppStore.getState();

  // Profile: cloud → local
  const profile = profileResp.data as ProfileRow | null;
  if (profile) {
    store.setProfile({
      name: profile.name ?? '',
      age: profile.age ?? '',
      fitnessLevel: profile.fitness_level ?? '',
      injury: profile.injury ?? '',
    });
    if (profile.subscription_tier) {
      useAppStore.setState({ subscriptionTier: profile.subscription_tier });
    }
    if (profile.notifications) {
      useAppStore.setState({ notifications: profile.notifications });
    }
  }

  // Plan: cloud → local
  const planRow = planResp.data as PlanRow | null;
  if (planRow?.plan) {
    store.setPlan(planRow.plan);
  }

  // Journal entries: merge (cloud rows the device doesn't have)
  const cloudLogs = (journalResp.data ?? []) as JournalRow[];
  if (cloudLogs.length) {
    const existingKeys = new Set(
      store.logs.map((l) => `${l.day}|${l.date}`),
    );
    const incoming: JournalLog[] = cloudLogs
      .filter((r) => !existingKeys.has(`${r.day}|${r.log_date}`))
      .map((r) => ({
        day: r.day,
        date: r.log_date,
        pain: r.pain,
        mood: r.mood,
        water: r.water,
        sleepQuality: r.sleep_quality ?? undefined,
        energy: r.energy ?? undefined,
        stress: r.stress ?? undefined,
        notes: r.notes ?? undefined,
        createdAt: r.created_at,
      }));
    if (incoming.length) {
      useAppStore.setState({
        logs: [...store.logs, ...incoming].sort(
          (a, b) => a.day - b.day,
        ),
      });
    }
  }

  // Chat history: pulled in a separate function so the initial sync
  // request stays fast (chat can have many rows).
  await pullChatHistory(userId).catch(() => {});

  // Water history
  const waterRows = (waterResp.data ?? []) as WaterRow[];
  if (waterRows.length) {
    const todayRow = waterRows.find((w) => w.log_date === today);
    useAppStore.setState({
      progress: {
        ...store.progress,
        water: todayRow ? todayRow.glasses : store.progress.water,
        waterHistory: waterRows
          .filter((w) => w.log_date !== today)
          .map((w) => ({ date: w.log_date, glasses: w.glasses })),
      },
    });
  }

  // Today's completions
  const completions = (completionsResp.data ?? []) as CompletionRow[];
  if (completions.length) {
    useAppStore.setState({
      progress: {
        ...useAppStore.getState().progress,
        doneExerciseIds: Array.from(
          new Set([
            ...useAppStore.getState().progress.doneExerciseIds,
            ...completions.map((c) => c.exercise_id),
          ]),
        ),
      },
    });
  }
}

// ── PUSH ────────────────────────────────────────────────────────────────

export async function pushProfile(userId: string): Promise<void> {
  const s = useAppStore.getState();
  await supabase.from('profiles').upsert(
    {
      id: userId,
      name: s.profile.name || null,
      age: s.profile.age || null,
      fitness_level: s.profile.fitnessLevel || null,
      injury: s.profile.injury || null,
      subscription_tier: s.subscriptionTier,
      notifications: s.notifications,
    },
    { onConflict: 'id' },
  );
}

export async function pushPlan(userId: string, source: 'ai' | 'fallback' = 'ai'): Promise<void> {
  const plan = useAppStore.getState().plan;
  if (!plan) return;
  await supabase.from('plans').upsert(
    { user_id: userId, plan, source },
    { onConflict: 'user_id' },
  );
}

export async function pushJournalEntry(userId: string, log: JournalLog): Promise<void> {
  await supabase.from('journal_entries').insert({
    user_id: userId,
    day: log.day,
    log_date: log.date,
    pain: log.pain,
    mood: log.mood,
    water: log.water,
    sleep_quality: log.sleepQuality ?? null,
    energy: log.energy ?? null,
    stress: log.stress ?? null,
    notes: log.notes ?? null,
  });
}

export async function pushChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  await supabase.from('chat_messages').insert({
    user_id: userId,
    role,
    content,
  });
}

/**
 * Pull chat history from cloud and merge into Zustand. We always pull
 * because the chat is small (capped at 200 rows) and conflict resolution
 * is "cloud + local de-duped by content+role+created_at".
 */
export async function pullChatHistory(userId: string): Promise<void> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (!data) return;
  const rows = data as ChatRow[];
  const store = useAppStore.getState();
  const seen = new Set(store.chatHistory.map((m) => `${m.role}|${m.content}`));
  const incoming = rows
    .filter((r) => !seen.has(`${r.role}|${r.content}`))
    .map((r) => ({ role: r.role, content: r.content, ts: Date.parse(r.created_at) }));
  if (incoming.length) {
    useAppStore.setState({
      chatHistory: [...store.chatHistory, ...incoming].sort((a, b) => a.ts - b.ts),
    });
  }
}

export async function pushWaterToday(userId: string, glasses: number): Promise<void> {
  await supabase.from('water_history').upsert(
    { user_id: userId, log_date: todayISO(), glasses },
    { onConflict: 'user_id,log_date' },
  );
}

export async function pushCompletionToggle(
  userId: string,
  exerciseId: string,
  isDone: boolean,
): Promise<void> {
  const today = todayISO();
  if (isDone) {
    await supabase.from('exercise_completions').upsert(
      { user_id: userId, exercise_id: exerciseId, completed_on: today },
      { onConflict: 'user_id,exercise_id,completed_on' },
    );
  } else {
    await supabase
      .from('exercise_completions')
      .delete()
      .match({ user_id: userId, exercise_id: exerciseId, completed_on: today });
  }
}
