// Auth helpers wrapping supabase.auth. The session itself is persisted
// inside the Supabase client (AsyncStorage adapter from src/lib/supabase.ts),
// so we don't duplicate that — useAuth() just listens for state changes.

import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

const SESSION_LOOKUP_TIMEOUT_MS = 6_000;

export interface AuthState {
  /** True while we're still resolving the initial session. */
  loading: boolean;
  session: Session | null;
  user: User | null;
}

/**
 * Subscribe to Supabase auth state. Returns loading=true until the very
 * first session lookup resolves so we don't flash the wrong screen.
 *
 * The initial getSession() can race against a stale token refresh that
 * needs a real HTTP round-trip — on a 17-KB/s mobile connection that
 * round-trip can take >30s, during which the app appears frozen on a
 * spinner. We cap the wait at SESSION_LOOKUP_TIMEOUT_MS and treat the
 * timeout as "no session" so the AuthScreen renders and the user can
 * at least try to sign in. The onAuthStateChange listener still fires
 * later if the network catches up.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const resolve = (session: Session | null) => {
      if (!mounted || resolved) return;
      resolved = true;
      setState({ loading: false, session, user: session?.user ?? null });
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolve(session))
      .catch(() => resolve(null));

    // Hard ceiling — never hang on a slow network forever
    const timer = setTimeout(() => resolve(null), SESSION_LOOKUP_TIMEOUT_MS);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      // After the initial resolve, we still want to react to login/logout
      setState({ loading: false, session, user: session?.user ?? null });
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export async function signUpWithEmail({ email, password, name }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: name ? { data: { name: name.trim() } } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the user-supplied display name from auth metadata (falls back to
 * the local-part of the email). Used as a default for the profile name.
 */
export function displayNameFor(user: User | null): string {
  if (!user) return 'Friend';
  const meta = user.user_metadata as { name?: string } | null;
  if (meta?.name) return meta.name;
  if (user.email) return user.email.split('@')[0];
  return 'Friend';
}
