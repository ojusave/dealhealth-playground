import {
  DATED_SNAPSHOT_PATTERN,
  FALLBACK_MODELS,
  MODEL_OVERRIDES,
  NON_CHAT_PATTERNS,
  PROVIDER_INCLUDE_PATTERNS,
  type ModelTier,
  type ProviderName,
} from "./models.overrides.js";

export interface DiscoveredModel {
  id: string;
  provider: ProviderName;
  label: string;
  tier: ModelTier;
  default?: boolean;
  isNew?: boolean;
  pinned?: number;
  createdAt?: string;
}

export interface ProviderRegistryState {
  configured: boolean;
  models: DiscoveredModel[];
  fetchedAt: string | null;
  source: "live" | "stale" | "unavailable";
  error?: string;
}

export interface ModelRegistrySnapshot {
  providers: Record<ProviderName, ProviderRegistryState>;
  defaultModelId: string;
}

function prettifyId(id: string): string {
  return id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Gpt/g, "GPT")
    .replace(/Grok/g, "Grok");
}

function isChatModel(id: string): boolean {
  if (DATED_SNAPSHOT_PATTERN.test(id)) return false;
  return !NON_CHAT_PATTERNS.some((p) => p.test(id));
}

function passesProviderFilter(id: string, provider: ProviderName): boolean {
  return PROVIDER_INCLUDE_PATTERNS[provider].test(id);
}

function applyOverrides(raw: { id: string; provider: ProviderName; createdAt?: string }[]): DiscoveredModel[] {
  const out: DiscoveredModel[] = [];
  for (const item of raw) {
    const override = MODEL_OVERRIDES[item.id];
    if (override?.deny) continue;
    out.push({
      id: item.id,
      provider: item.provider,
      label: override?.label ?? prettifyId(item.id),
      tier: override?.tier ?? "balanced",
      default: override?.default,
      isNew: !override,
      pinned: override?.pinned,
      createdAt: item.createdAt,
    });
  }
  return out.sort((a, b) => {
    const pinA = a.pinned ?? 999;
    const pinB = b.pinned ?? 999;
    if (pinA !== pinB) return pinA - pinB;
    const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
    const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
    return timeB - timeA;
  });
}

export function filterProviderModels(
  provider: ProviderName,
  ids: Array<{ id: string; createdAt?: string }>
): DiscoveredModel[] {
  const filtered = ids
    .filter((m) => isChatModel(m.id) && passesProviderFilter(m.id, provider))
    .map((m) => ({ id: m.id, provider, createdAt: m.createdAt }));
  return applyOverrides(filtered);
}

export function fallbackForProvider(provider: ProviderName): DiscoveredModel[] {
  return applyOverrides(
    FALLBACK_MODELS.filter((m) => m.provider === provider).map((m) => ({
      id: m.id,
      provider: m.provider,
    }))
  );
}

export function resolveProvider(modelId: string): ProviderName | null {
  if (modelId.startsWith("gpt-")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("grok-")) return "xai";
  return null;
}

export function defaultModelId(models: DiscoveredModel[]): string {
  const explicit = models.find((m) => m.default);
  if (explicit) return explicit.id;
  return models.find((m) => m.id === "gpt-5.6-terra")?.id ?? models[0]?.id ?? "gpt-5.6-terra";
}

export function emptyRegistry(): ModelRegistrySnapshot {
  const unavailable = (provider: ProviderName): ProviderRegistryState => ({
    configured: false,
    models: [],
    fetchedAt: null,
    source: "unavailable",
  });
  const providers = {
    openai: unavailable("openai"),
    anthropic: unavailable("anthropic"),
    xai: unavailable("xai"),
  };
  return { providers, defaultModelId: "" };
}
