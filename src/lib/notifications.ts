// Local notification scheduling — wraps expo-notifications.
//
// v1.8: schedules are now DERIVED from the user's chosen bounds
// (Profile → Notifications). Exercise reminders spread N slots evenly
// between start and end; hydration reminders fire every 90 minutes
// between the same bounds; the journal reminder is a single time. The
// same three defaults from v1.7 are baked in as fallbacks so an existing
// user who never touches the settings sees no behaviour change.
//
// Each toggle in Profile owns a category of scheduled IDs; toggling off
// cancels just that category, leaving others intact.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderCategory = 'exercise' | 'water' | 'journal';

/** "HH:MM" — always zero-padded so string sort matches chronological. */
export type TimeOfDay = string;

export interface ReminderTimes {
  exercise: { start: TimeOfDay; end: TimeOfDay };
  water: { start: TimeOfDay; end: TimeOfDay };
  journal: { time: TimeOfDay };
}

export const DEFAULT_REMINDER_TIMES: ReminderTimes = {
  exercise: { start: '09:00', end: '21:00' },
  water: { start: '09:00', end: '19:30' },
  journal: { time: '20:00' },
};

const STORAGE_KEY = '@recova/scheduled-notifications';
const ANDROID_CHANNEL = 'recova-reminders';
/** How many exercise reminders to spread across the day. */
const EXERCISE_SLOT_COUNT = 5;
/** Minutes between water pings. */
const WATER_INTERVAL_MIN = 90;

const COPY: Record<ReminderCategory, { title: string; body: string }> = {
  exercise: {
    title: 'Time for your recovery exercises',
    body: 'A few minutes of movement now keeps your progress on track.',
  },
  water: {
    title: 'Hydration check-in',
    body: 'Joints heal faster when you stay hydrated. Drink a glass.',
  },
  journal: {
    title: 'Log your day',
    body: 'How was today? Pain, mood, anything you noticed.',
  },
};

interface Slot { hour: number; minute: number }
type ScheduledMap = Partial<Record<ReminderCategory, string[]>>;

function parseTime(s: TimeOfDay): Slot {
  const parts = s.split(':');
  return {
    hour: clamp(parseInt(parts[0], 10) || 0, 0, 23),
    minute: clamp(parseInt(parts[1], 10) || 0, 0, 59),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Format a TimeOfDay in the user's locale (12h vs 24h picked by RN). */
export function formatTime(t: TimeOfDay, locale?: string): string {
  const { hour, minute } = parseTime(t);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  try {
    return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return t;
  }
}

/**
 * Compute slots for a category from the user's bounds. Kept pure so we
 * can unit-test the spread rule in isolation of expo-notifications.
 */
export function computeSlots(
  category: ReminderCategory,
  times: ReminderTimes,
): Slot[] {
  if (category === 'journal') return [parseTime(times.journal.time)];

  const { start, end } = category === 'exercise' ? times.exercise : times.water;
  const s = parseTime(start);
  const e = parseTime(end);
  const startMin = s.hour * 60 + s.minute;
  const endMin = e.hour * 60 + e.minute;
  if (endMin <= startMin) return [{ hour: s.hour, minute: s.minute }];

  if (category === 'exercise') {
    // N evenly spaced slots including both endpoints.
    const span = endMin - startMin;
    const step = span / (EXERCISE_SLOT_COUNT - 1);
    const out: Slot[] = [];
    for (let i = 0; i < EXERCISE_SLOT_COUNT; i++) {
      const m = Math.round(startMin + step * i);
      out.push({ hour: Math.floor(m / 60), minute: m % 60 });
    }
    return out;
  }

  // water: every 90 minutes
  const out: Slot[] = [];
  for (let m = startMin; m <= endMin && out.length < 12; m += WATER_INTERVAL_MIN) {
    out.push({ hour: Math.floor(m / 60), minute: m % 60 });
  }
  return out;
}

async function loadMap(): Promise<ScheduledMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMap(map: ScheduledMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // best-effort
  }
}

/**
 * Set up the global notification handler. Call this once on app startup
 * — controls how notifications are displayed when the app is foregrounded.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Make sure the Android notification channel exists. Android 8+ ignores
 * notifications that don't belong to a channel. iOS is a no-op.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Recovery reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#84CC16',
  });
}

/**
 * Ask for permission. Returns true if we can post notifications.
 * Idempotent — if already granted, doesn't re-prompt.
 */
export async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

/**
 * Cancel all scheduled notifications for a single category.
 */
async function cancelCategory(category: ReminderCategory): Promise<void> {
  const map = await loadMap();
  const ids = map[category] ?? [];
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
  delete map[category];
  await saveMap(map);
}

/**
 * Schedule daily reminders for a category. Cancels any previous schedule
 * for the same category first so toggling off/on doesn't double-fire.
 */
async function scheduleCategory(
  category: ReminderCategory,
  times: ReminderTimes,
): Promise<void> {
  await cancelCategory(category);
  const newIds: string[] = [];

  for (const slot of computeSlots(category, times)) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: COPY[category].title,
        body: COPY[category].body,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
      },
    });
    newIds.push(id);
  }

  const map = await loadMap();
  map[category] = newIds;
  await saveMap(map);
}

/**
 * Apply a toggle. If `enabled` is true, requests permission (if needed)
 * and schedules the category with the caller-supplied times; if false,
 * cancels its notifications. Returns whether the operation succeeded
 * (false typically means the user denied permission).
 */
export async function applyReminderToggle(
  category: ReminderCategory,
  enabled: boolean,
  times: ReminderTimes = DEFAULT_REMINDER_TIMES,
): Promise<boolean> {
  if (!enabled) {
    await cancelCategory(category);
    return true;
  }
  const ok = await ensurePermission();
  if (!ok) return false;
  await ensureAndroidChannel();
  await scheduleCategory(category, times);
  return true;
}

/**
 * Re-apply all known reminders. Useful on app startup so notifications
 * stay scheduled across reboots / app reinstalls of the dev client.
 */
export async function reapplyAllFromStore(
  prefs: { exercise: boolean; water: boolean; journal: boolean },
  times: ReminderTimes = DEFAULT_REMINDER_TIMES,
): Promise<void> {
  for (const key of ['exercise', 'water', 'journal'] as const) {
    if (prefs[key]) {
      await applyReminderToggle(key, true, times);
    }
  }
}

/**
 * Cancel every scheduled notification for this app + drop our stored
 * id-map. Called on sign-out so reminders we scheduled for user A
 * don't keep firing on the device for user B.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore — best-effort cleanup
  }
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
