// Local notification scheduling — wraps expo-notifications.
//
// We schedule individual daily reminders at fixed hours rather than using a
// pure interval-based repeat, so that we respect waking hours and the user
// isn't pinged at 3 AM. Each toggle in Profile owns a category of scheduled
// IDs; toggling off cancels just that category, leaving others intact.
//
// Notification permissions are requested lazily on first toggle. If denied,
// we leave the toggle state alone — the user can re-enable in OS settings
// later and re-toggle the switch.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderCategory = 'exercise' | 'water' | 'journal';

const STORAGE_KEY = '@recova/scheduled-notifications';
const ANDROID_CHANNEL = 'recova-reminders';

/** Hour-of-day reminder schedule per category (24h, local time). */
const SCHEDULES: Record<ReminderCategory, Array<{ hour: number; minute: number }>> = {
  exercise: [
    { hour: 9,  minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 15, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 0 },
  ],
  water: [
    { hour: 9,  minute: 0 },
    { hour: 10, minute: 30 },
    { hour: 12, minute: 0 },
    { hour: 13, minute: 30 },
    { hour: 15, minute: 0 },
    { hour: 16, minute: 30 },
    { hour: 18, minute: 0 },
    { hour: 19, minute: 30 },
  ],
  journal: [
    { hour: 20, minute: 0 },
  ],
};

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

type ScheduledMap = Partial<Record<ReminderCategory, string[]>>;

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
async function scheduleCategory(category: ReminderCategory): Promise<void> {
  await cancelCategory(category);
  const newIds: string[] = [];

  for (const slot of SCHEDULES[category]) {
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
 * and schedules the category; if false, cancels its notifications.
 * Returns whether the operation succeeded (false typically means the user
 * denied permission).
 */
export async function applyReminderToggle(
  category: ReminderCategory,
  enabled: boolean,
): Promise<boolean> {
  if (!enabled) {
    await cancelCategory(category);
    return true;
  }
  const ok = await ensurePermission();
  if (!ok) return false;
  await ensureAndroidChannel();
  await scheduleCategory(category);
  return true;
}

/**
 * Re-apply all known reminders. Useful on app startup so notifications
 * stay scheduled across reboots / app reinstalls of the dev client.
 */
export async function reapplyAllFromStore(prefs: {
  exercise: boolean;
  water: boolean;
  journal: boolean;
}): Promise<void> {
  for (const key of ['exercise', 'water', 'journal'] as const) {
    if (prefs[key]) {
      await applyReminderToggle(key, true);
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
