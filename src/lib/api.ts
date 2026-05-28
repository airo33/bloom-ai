// Typed wrappers around our Supabase Edge Functions.
// All calls go through supabase.functions.invoke which automatically attaches
// the anon JWT — required because the functions have verify_jwt = true.

import { supabase } from './supabase';
import type { RehabPlan, FitnessLevel } from '../types/plan';

export interface GeneratePlanInput {
  name?: string;
  age?: string;
  fitnessLevel?: FitnessLevel | '';
  injury: string;
}

export interface GeneratePlanResult {
  plan: RehabPlan;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * supabase-js FunctionsHttpError surfaces the response on `context` (a Response).
 * The public type is `unknown`, so we narrow it carefully here.
 */
async function extractFunctionsErrorMessage(err: unknown): Promise<string> {
  if (err && typeof err === 'object') {
    const ctx = (err as { context?: unknown }).context;
    if (
      ctx &&
      typeof ctx === 'object' &&
      'json' in ctx &&
      typeof (ctx as { json: unknown }).json === 'function'
    ) {
      try {
        const body = await (ctx as { json: () => Promise<unknown> }).json();
        if (body && typeof body === 'object' && 'error' in body) {
          return String((body as { error: unknown }).error);
        }
      } catch {
        // fall through to message
      }
    }
    if ('message' in err) return String((err as { message: unknown }).message);
  }
  return 'Unknown error';
}

/**
 * Call the `generate-plan` Edge Function. Throws ApiError on failure so the
 * caller can decide whether to surface the error or fall back to a static plan.
 */
export async function generatePlan(input: GeneratePlanInput): Promise<GeneratePlanResult> {
  const { data, error } = await supabase.functions.invoke<GeneratePlanResult & { error?: string }>(
    'generate-plan',
    { body: input },
  );

  if (error) {
    // FunctionsHttpError exposes the response body in `context` — try to use it
    const msg = await extractFunctionsErrorMessage(error);
    throw new ApiError(500, msg);
  }

  if (!data || 'error' in data) {
    throw new ApiError(502, (data as { error?: string })?.error ?? 'Unknown error');
  }

  return data;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
}

/** Call the `chat-physio` Edge Function with current plan + history. */
export async function chatPhysio(opts: {
  plan: RehabPlan | null;
  history: ChatMessage[];
  userMessage: string;
}): Promise<ChatResult> {
  const { data, error } = await supabase.functions.invoke<ChatResult & { error?: string }>(
    'chat-physio',
    { body: opts },
  );

  if (error) {
    const msg = await extractFunctionsErrorMessage(error);
    throw new ApiError(500, msg);
  }

  if (!data || 'error' in data) {
    throw new ApiError(502, (data as { error?: string })?.error ?? 'Unknown error');
  }

  return data;
}
