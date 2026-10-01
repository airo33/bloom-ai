// LLM provider abstraction. Currently wired to Groq's OpenAI-compatible
// chat completions endpoint. Model IDs are read from secrets (see below) so
// Groq's frequent model rotations/decommissions are a config change, not a
// code deploy. The shape is OpenAI-compatible so swapping to Anthropic /
// OpenAI / OpenRouter later is one helper.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Model IDs, resolved from secrets with last-known-good defaults. Override any
// of these without redeploying code, e.g.:
//   supabase secrets set GROQ_PLAN_MODEL=llama-3.3-70b-versatile
// Whenever Groq decommissions a model (returns 404 model_not_found) or an
// account's TPM ceiling makes it unreliable, update the matching secret.
// callLLM() also falls back to FALLBACK_MODEL automatically so plan
// generation degrades to a working model instead of the static fallback.
// Defaults are the models this Groq account actually has access to (verified
// via the models endpoint — this key has NO Llama access, only gpt-oss/qwen).
export const PLAN_MODEL = Deno.env.get('GROQ_PLAN_MODEL')?.trim() || 'openai/gpt-oss-120b';
export const CHAT_MODEL = Deno.env.get('GROQ_CHAT_MODEL')?.trim() || 'openai/gpt-oss-20b';
export const FALLBACK_MODEL =
  Deno.env.get('GROQ_FALLBACK_MODEL')?.trim() || 'openai/gpt-oss-20b';
// Vision is a separate lineup from text models on Groq — used only when a
// chat message includes a photo.
export const VISION_MODEL = Deno.env.get('GROQ_VISION_MODEL')?.trim() || 'qwen/qwen3.8-27b';

/** A plain text segment of a message. */
export interface TextContentPart {
  type: 'text';
  text: string;
}

/** An image segment — a base64 data URL or a public https URL. */
export interface ImageContentPart {
  type: 'image_url';
  image_url: { url: string };
}

/**
 * Message content is either a plain string (the common text case) or, for
 * vision requests, an OpenAI-compatible array of text/image parts. Groq's
 * chat/completions endpoint accepts this array verbatim on vision models.
 */
export type MessageContent = string | Array<TextContentPart | ImageContentPart>;

export interface MessagePart {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

export interface CallOptions {
  model: string;
  maxTokens: number;
  messages: MessagePart[];
  temperature?: number;
  /** When true, sends response_format={type:'json_object'} so the model
   *  guarantees valid JSON output. Groq supports this on most models. */
  jsonMode?: boolean;
  /** Models to try (in order) if `model` fails because it's unavailable
   *  (404/model_not_found) or because this account's rate/TPM ceiling for
   *  that model is too tight for the request (429/413). Lets a
   *  decommissioned or over-tight primary model degrade to a working one
   *  instead of failing outright -- e.g. plan generation falling through
   *  to the static fallback plan for every user. */
  fallbackModels?: string[];
}

export interface LLMResponse {
  text: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** Raw OpenAI-compatible chat response shape we care about. */
interface OpenAICompatResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}

export async function callLLM(opts: CallOptions): Promise<LLMResponse> {
  // Defensively sanitize the API key. HTTP headers are ByteStrings — they
  // can't contain newlines, carriage returns, smart quotes or anything
  // outside 0x20-0x7E. We strip whitespace at the edges, then any char
  // outside the printable-ASCII range so a copy-pasted key with a stray
  // unicode character still works.
  const rawKey = Deno.env.get('GROQ_API_KEY') ?? '';
  const apiKey = rawKey.trim().replace(/[^\x20-\x7E]/g, '');

  if (!apiKey) {
    throw new Error(
      `GROQ_API_KEY not configured (raw length=${rawKey.length}, cleaned length=${apiKey.length})`,
    );
  }
  if (apiKey.length < 20) {
    throw new Error(
      `GROQ_API_KEY looks too short (cleaned length=${apiKey.length}). ` +
        `Make sure you set the full secret with: supabase secrets set GROQ_API_KEY=gsk_...`,
    );
  }
  if (!apiKey.startsWith('gsk_')) {
    throw new Error(
      `GROQ_API_KEY format unexpected (starts with "${apiKey.slice(0, 4)}"). ` +
        `Groq keys start with "gsk_". Did you paste the wrong key?`,
    );
  }

  // Try the primary model, then any fallbacks — but only fall through when
  // the failure looks model-specific (unavailable, or this account's rate/
  // TPM ceiling for that model is too tight for the request). Other
  // failures (auth, server error) aren't model-specific, so we surface
  // them immediately rather than masking them behind a fallback.
  const models = [opts.model, ...(opts.fallbackModels ?? [])].filter(Boolean);
  let lastError = '';

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const body: Record<string, unknown> = {
      model,
      max_tokens: opts.maxTokens,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      const data = (await resp.json()) as OpenAICompatResponse;
      const text = data.choices?.[0]?.message?.content ?? '';
      return {
        text,
        usage: {
          input_tokens: data.usage?.prompt_tokens ?? 0,
          output_tokens: data.usage?.completion_tokens ?? 0,
        },
      };
    }

    const text = await resp.text();
    lastError = `Groq API ${resp.status} (model ${model}): ${text}`;
    const modelUnavailable =
      resp.status === 404 || /model_not_found|does not exist|do not have access/i.test(text);
    // A 429/413 tokens-per-minute ceiling is specific to that model+account
    // combo (e.g. a large model's on-demand TPM limit being tighter than
    // the request), not a blanket "Groq is down" failure -- worth trying a
    // smaller fallback model rather than giving up immediately.
    const rateLimited =
      (resp.status === 429 || resp.status === 413) &&
      /rate_limit|tokens per minute|TPM/i.test(text);
    const hasNext = i < models.length - 1;
    if ((modelUnavailable || rateLimited) && hasNext) {
      console.warn(
        `[llm] model "${model}" unavailable/rate-limited, falling back to "${models[i + 1]}"`,
      );
      continue;
    }
    throw new Error(lastError);
  }

  throw new Error(lastError || 'callLLM: no model configured');
}

/**
 * Parse JSON out of an LLM response. Handles:
 *  - bare JSON object (the common case with jsonMode)
 *  - JSON wrapped in ```json ... ``` fences (fallback)
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
