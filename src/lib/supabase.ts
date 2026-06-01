// Supabase client — uses AsyncStorage for session persistence on the device.
// URL and anon key come from EXPO_PUBLIC_ env vars (set in .env).
//
// Defensive note: this module is loaded at app start. Anything that throws
// here would crash the app before any UI renders. We wrap initialization
// in a try/catch and fall back to a no-op placeholder client. Any code
// that actually uses Supabase (auth/sync) will then fail at call time
// with a clear error — much easier to debug than a generic launch crash.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const FETCH_TIMEOUT_MS = 25_000;

// IMPORTANT: must use LITERAL property access on process.env, not
// dynamic indexing. Metro's babel transform only inlines literal lookups
// at build time — `process.env[`EXPO_PUBLIC_${key}`]` stays in the
// bundle and resolves to `undefined` at runtime because React Native
// has no real process.env.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing.',
  );
}

const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal })
    .catch((err: unknown) => {
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'AbortError'
      ) {
        const e = new Error(
          `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s — network is slow or unreachable`,
        );
        (e as Error & { code?: string }).code = 'TIMEOUT';
        throw e;
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
};

// Create the client lazily inside a try/catch. If createClient itself
// throws at import time (e.g. a polyfill issue on certain Android ROMs),
// we still keep the module exports defined so consumers don't blow up.
let _supabase: SupabaseClient;
try {
  _supabase = createClient(
    SUPABASE_URL ?? 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY ?? 'placeholder',
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: fetchWithTimeout,
      },
    },
  );
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[supabase] createClient failed:', err);
  // Minimum-viable stub so module-level imports don't crash. Any real
  // call (auth/getSession etc.) will throw and be caught by useAuth or
  // the api wrappers.
  _supabase = createClient('https://placeholder.supabase.co', 'placeholder') as SupabaseClient;
}

export const supabase = _supabase;
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export { SUPABASE_URL };
