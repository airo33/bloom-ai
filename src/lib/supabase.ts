// Supabase client — uses AsyncStorage for session persistence on the device.
// URL and anon key come from EXPO_PUBLIC_ env vars (set in app.json -> extra
// or in a .env / .env.local file). Both are public/safe to ship.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

function readConfig(key: string): string {
  // Try Expo public env vars first (preferred), then app.json `extra`.
  const fromEnv =
    process.env[`EXPO_PUBLIC_${key}`] ??
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key];
  if (!fromEnv) {
    throw new Error(
      `Missing config: EXPO_PUBLIC_${key} (set in .env or app.json -> extra.${key})`,
    );
  }
  return fromEnv;
}

const SUPABASE_URL = readConfig('SUPABASE_URL');
const SUPABASE_ANON_KEY = readConfig('SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL };
