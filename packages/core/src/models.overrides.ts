export const FALLBACK_MODELS = [
  { id: "gpt-5.6-sol", provider: "openai" as const, label: "GPT-5.6 Sol", tier: "flagship" as const },
  { id: "gpt-5.6-terra", provider: "openai" as const, label: "GPT-5.6 Terra", tier: "balanced" as const, default: true },
  { id: "gpt-5.6-luna", provider: "openai" as const, label: "GPT-5.6 Luna", tier: "fast" as const },
  { id: "claude-fable-5", provider: "anthropic" as const, label: "Claude Fable 5", tier: "flagship" as const },
  { id: "claude-opus-4-8", provider: "anthropic" as const, label: "Claude Opus 4.8", tier: "balanced" as const },
  { id: "claude-sonnet-4-6", provider: "anthropic" as const, label: "Claude Sonnet 4.6", tier: "fast" as const },
  { id: "grok-4.5", provider: "xai" as const, label: "Grok 4.5", tier: "flagship" as const },
] as const;

export type ProviderName = "openai" | "anthropic" | "xai";
export type ModelTier = "flagship" | "balanced" | "fast";

export interface ModelOverride {
  label?: string;
  tier?: ModelTier;
  default?: boolean;
  pinned?: number;
  deny?: boolean;
}

export const MODEL_OVERRIDES: Record<string, ModelOverride> = {
  "gpt-5.6-sol": { label: "GPT-5.6 Sol", tier: "flagship", pinned: 1 },
  "gpt-5.6-terra": { label: "GPT-5.6 Terra", tier: "balanced", default: true, pinned: 2 },
  "gpt-5.6-luna": { label: "GPT-5.6 Luna", tier: "fast", pinned: 3 },
  "claude-fable-5": { label: "Claude Fable 5", tier: "flagship", pinned: 1 },
  "claude-opus-4-8": { label: "Claude Opus 4.8", tier: "balanced", pinned: 2 },
  "claude-sonnet-4-6": { label: "Claude Sonnet 4.6", tier: "fast", pinned: 3 },
  "claude-sonnet-5": { label: "Claude Sonnet 5", tier: "fast", pinned: 4 },
  "grok-4.5": { label: "Grok 4.5", tier: "flagship", pinned: 1 },
};

export const PROVIDER_INCLUDE_PATTERNS: Record<ProviderName, RegExp> = {
  openai: /^gpt-5/i,
  anthropic: /^claude-(fable|opus|sonnet|haiku)/i,
  xai: /^grok-4/i,
};

export const NON_CHAT_PATTERNS = [
  /embed/i,
  /moderation/i,
  /tts|whisper|audio|transcri/i,
  /realtime/i,
  /image|dall-e|vision-preview/i,
  /video/i,
];

export const DATED_SNAPSHOT_PATTERN = /-\d{4}-\d{2}-\d{2}$/;
