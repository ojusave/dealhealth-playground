import OpenAI from "openai";
import { resolveProvider } from "./model-filter.js";

export interface CallModelInput {
  modelId: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  schemaName: string;
  maxTokens: number;
  keys: {
    openai?: string;
    anthropic?: string;
    xai?: string;
  };
}

const TIMEOUT_MS = 60_000;

function providerKey(input: CallModelInput): string {
  const provider = resolveProvider(input.modelId);
  if (!provider) throw new Error(`Unknown provider for model ${input.modelId}`);
  const key = input.keys[provider];
  if (!key) throw new Error(`No API key configured for ${provider}`);
  return key;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return trimmed;
}

async function callOpenAi(input: CallModelInput, apiKey: string, retryHint?: string): Promise<string> {
  const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS });
  const user = retryHint ? `${input.user}\n\nPrevious validation error: ${retryHint}` : input.user;
  const response = await client.responses.create({
    model: input.modelId,
    input: [
      { role: "system", content: input.system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_output_tokens: input.maxTokens,
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
  });
  const text = response.output_text;
  if (!text) throw new Error("OpenAI returned empty output");
  return text;
}

async function callAnthropic(input: CallModelInput, apiKey: string, retryHint?: string): Promise<string> {
  const user = retryHint ? `${input.user}\n\nPrevious validation error: ${retryHint}` : input.user;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.modelId,
      max_tokens: input.maxTokens,
      temperature: 0.2,
      system: input.system,
      messages: [{ role: "user", content: user }],
      output_config: {
        format: {
          type: "json_schema",
          schema: input.schema,
        },
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const block = body.content?.find((b) => b.type === "text");
  if (!block?.text) throw new Error("Anthropic returned no text block");
  return block.text;
}

async function callXai(input: CallModelInput, apiKey: string, retryHint?: string): Promise<string> {
  const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1", timeout: TIMEOUT_MS });
  const user = retryHint ? `${input.user}\n\nPrevious validation error: ${retryHint}` : input.user;
  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: input.modelId,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: input.maxTokens,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
  };
  try {
    const response = await client.chat.completions.create(params);
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("xAI returned empty output");
    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("400") || message.includes("temperature")) {
      const { temperature: _t, ...rest } = params;
      const response = await client.chat.completions.create(rest);
      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("xAI returned empty output after retry");
      return text;
    }
    throw err;
  }
}

/** Dispatch a structured JSON call to the right provider and validate with zod in the caller. */
export async function callModel<T>(
  input: CallModelInput,
  parse: (raw: string) => T
): Promise<T> {
  const provider = resolveProvider(input.modelId);
  if (!provider) throw new Error(`Unsupported model: ${input.modelId}`);
  const key = providerKey(input);

  const run = async (retryHint?: string): Promise<T> => {
    let raw: string;
    if (provider === "openai") raw = await callOpenAi(input, key, retryHint);
    else if (provider === "anthropic") raw = await callAnthropic(input, key, retryHint);
    else raw = await callXai(input, key, retryHint);
    try {
      return parse(extractJson(raw));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!retryHint) return run(msg);
      throw err;
    }
  };

  return run();
}
