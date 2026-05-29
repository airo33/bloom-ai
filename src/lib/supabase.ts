// Supabase client — uses AsyncStorage for session persistence on the device.
// URL and anon key come from EXPO_PUBLIC_ env vars (set in .env). Both are
// public/safe to ship.
//
// We install a custom fetch that ALWAYS times out after a fixed budget so
// slow / lossy mobile networks (think 17 KB/s through a VPN tunnel) can't
// hang the UI forever. Without this, requests can sit in the queue for
// minutes before the OS gives up.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const FETCH_TIMEOUT_MS = 25_000;

function readConfig(key: string): string | undefined {
  return (
    process.env[`EXPO_PUBLIC_${key}`] ??
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key]
  );
}

const SUPABASE_URL = readConfig('SUPABASE_URL');
const SUPABASE_ANON_KEY = readConfig('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing.',
  );
}

/** fetch wrapper with a hard timeout + a clean error name we can match on. */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal })
    .catch((err: unknown) => {
      // AbortError on timeout → re-throw with a user-friendly name
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

export const supabase: SupabaseClient = createClient(
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

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export { SUPABASE_URL };
