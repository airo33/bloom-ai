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
  constructor(
    public status: number,
    message: string,
    /** Stable machine-readable code (e.g. 'not_an_injury'), if the server provided one. */
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * supabase-js FunctionsHttpError surfaces the response on `context` (a Response).
 * The public type is `unknown`, so we narrow it carefully here.
 */
interface ExtractedError {
  msg: string;
  code?: string;
  status: number;
}

async function extractFunctionsError(err: unknown): Promise<ExtractedError> {
  let status = 500;
  if (err && typeof err === 'object') {
    const ctx = (err as { context?: unknown }).context;
    if (
      ctx &&
      typeof ctx === 'object' &&
      'status' in ctx &&
      typeof (ctx as { status: unknown }).status === 'number'
    ) {
      status = (ctx as { status: number }).status;
    }
    if (
      ctx &&
      typeof ctx === 'object' &&
      'json' in ctx &&
      typeof (ctx as { json: unknown }).json === 'function'
    ) {
      try {
        const body = await (ctx as { json: () => Promise<unknown> }).json();
        if (body && typeof body === 'object') {
          const b = body as { error?: unknown; message?: unknown };
          const code = typeof b.error === 'string' ? b.error : undefined;
          const msg = typeof b.message === 'string'
            ? b.message
            : code ?? 'Unknown error';
          return { msg, code, status };
        }
      } catch {
        // fall through to message
      }
    }
    if ('message' in err) {
      return { msg: String((err as { message: unknown }).message), status };
    }
  }
  return { msg: 'Unknown error', status };
}

/** Kept for backwards compat in chatPhysio. */
async function extractFunctionsErrorMessage(err: unknown): Promise<string> {
  const { msg } = await extractFunctionsError(err);
  return msg;
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
    // FunctionsHttpError exposes the response body in `context` — extract
    // status + machine-readable code so the caller can branch on e.g.
    // ApiError.code === 'not_an_injury' instead of fuzzy-matching strings.
    const { msg, code, status } = await extractFunctionsError(error);
    throw new ApiError(status, msg, code);
  }

  if (!data || 'error' in data) {
    const d = data as { error?: string; message?: string } | null;
    throw new ApiError(502, d?.message ?? d?.error ?? 'Unknown error', d?.error);
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
