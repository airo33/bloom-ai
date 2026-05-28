// Minimal Anthropic Messages API client for Deno (no SDK needed).
// ANTHROPIC_API_KEY is set as a Supabase secret and never reaches the
// mobile client.

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export interface MessagePart {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallOptions {
  model: string;
  maxTokens: number;
  system?: string;
  messages: MessagePart[];
  /** Anthropic temperature, defaults to 1 if omitted */
  temperature?: number;
}

export interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export async function callAnthropic(opts: CallOptions): Promise<AnthropicResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets');
  }

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
      temperature: opts.temperature,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${text}`);
  }

  return (await resp.json()) as AnthropicResponse;
}

/** Extract the first text part from an Anthropic response. */
export function extractText(r: AnthropicResponse): string {
  const part = r.content.find((c) => c.type === 'text');
  return part?.text ?? '';
}

/**
 * Parse JSON out of an LLM response. Handles:
 *  - bare JSON object
 *  - JSON wrapped in ```json ... ``` fences
 *  - JSON embedded in surrounding prose
 *
 * Returns null on failure.
 */
export function parseJsonFromLLM(text: string): unknown | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {}
  }
  const objMatch = trimmed.match(/\{[\s\S]+\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }
  return null;
}
