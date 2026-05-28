// LLM provider abstraction. Currently wired to Groq's OpenAI-compatible
// chat completions endpoint — Llama 3.3 70B for plan generation,
// Llama 3.1 8B Instant for chat. The shape is OpenAI-compatible so
// swapping back to Anthropic / OpenAI / OpenRouter later is one helper.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface MessagePart {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallOptions {
  model: string;
  maxTokens: number;
  messages: MessagePart[];
  temperature?: number;
  /** When true, sends response_format={type:'json_object'} so the model
   *  guarantees valid JSON output. Groq supports this on most models. */
  jsonMode?: boolean;
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
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured in Supabase secrets');
  }

  const body: Record<string, unknown> = {
    model: opts.model,
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

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Groq API ${resp.status}: ${text}`);
  }

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
