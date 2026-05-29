// Supabase client — uses AsyncStorage for session persistence on the device.
// URL and anon key come from EXPO_PUBLIC_ env vars (set in .env). Both are
// public/safe to ship.
//
// IMPORTANT: this module is imported at JS-bundle load time. If we throw
// here the entire app fails to mount. So when env is missing we expose a
// dummy client that will only error on the FIRST actual call (and the call
// sites already have try/catch + static fallback).

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

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
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing.\n' +
      'Did you create .env and restart Metro? Edge Function calls will fail and the\n' +
      'app will fall back to the static plan.',
  );
}

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
  },
);

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export { SUPABASE_URL };
