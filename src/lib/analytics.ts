// Lightweight PostHog wrapper that gracefully no-ops when the API key
// isn't configured yet. Same auto-detect pattern as iap.ts — once the
// user creates a PostHog project and sets EXPO_PUBLIC_POSTHOG_KEY in
// EAS env vars (and rebuilds), every track() call starts shipping
// real events without code changes.
//
// We lazy-require so a missing native module never crashes the bundle.

import { Platform } from 'react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

type PostHogInstance = {
  identify: (id: string, props?: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  reset: () => void;
  screen: (name: string, props?: Record<string, unknown>) => void;
};

let instance: PostHogInstance | null = null;
let initialized = false;

function loadSdk(): unknown {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('posthog-react-native');
  } catch {
    return null;
  }
}

export async function setupAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!POSTHOG_KEY) {
    // eslint-disable-next-line no-console
    console.log('[analytics] disabled — no EXPO_PUBLIC_POSTHOG_KEY');
    return;
  }
  const sdk = loadSdk();
  if (!sdk) return;

  try {
    const PostHogCtor = (sdk as { PostHog?: new (...args: unknown[]) => PostHogInstance }).PostHog;
    if (!PostHogCtor) return;
    instance = new PostHogCtor(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
      defaultOptIn: true,
    });
    // eslint-disable-next-line no-console
    console.log('[analytics] PostHog ready');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] init failed:', err);
  }
}

/** Tie subsequent events to a user. Pass null on sign-out to reset. */
export function identify(userId: string | null, props?: Record<string, unknown>): void {
  if (!instance) return;
  try {
    if (userId) instance.identify(userId, { platform: Platform.OS, ...props });
    else instance.reset();
  } catch {
    // ignore
  }
}

/** Record an event. No-op if analytics not configured. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!instance) return;
  try {
    instance.capture(event, props);
  } catch {
    // ignore
  }
}

/** Record a screen view. */
export function trackScreen(name: string, props?: Record<string, unknown>): void {
  if (!instance) return;
  try {
    instance.screen(name, props);
  } catch {
    // ignore
  }
}
