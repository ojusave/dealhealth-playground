import type { ProviderName } from "./models.overrides.js";
import {
  emptyRegistry,
  fallbackForProvider,
  filterProviderModels,
  defaultModelId,
  type DiscoveredModel,
  type ModelRegistrySnapshot,
  type ProviderRegistryState,
} from "./model-filter.js";

const OPENAI_URL = "https://api.openai.com/v1/models";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/models";
const XAI_LANGUAGE_URL = "https://api.x.ai/v1/language-models";
const XAI_MODELS_URL = "https://api.x.ai/v1/models";

async function fetchOpenAiModels(apiKey: string): Promise<Array<{ id: string; createdAt?: string }>> {
  const res = await fetch(OPENAI_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`OpenAI list models failed: ${res.status}`);
  const body = (await res.json()) as { data?: Array<{ id: string; created?: number }> };
  return (body.data ?? []).map((m) => ({
    id: m.id,
    createdAt: m.created ? new Date(m.created * 1000).toISOString() : undefined,
  }));
}

async function fetchAnthropicModels(apiKey: string): Promise<Array<{ id: string; createdAt?: string }>> {
  const all: Array<{ id: string; createdAt?: string }> = [];
  let afterId: string | undefined;
  for (let page = 0; page < 10; page++) {
    const url = new URL(ANTHROPIC_URL);
    url.searchParams.set("limit", "100");
    if (afterId) url.searchParams.set("after_id", afterId);
    const res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Anthropic list models failed: ${res.status}`);
    const body = (await res.json()) as {
      data?: Array<{ id: string; created_at?: string }>;
      has_more?: boolean;
      last_id?: string;
    };
    for (const m of body.data ?? []) {
      all.push({ id: m.id, createdAt: m.created_at });
    }
    if (!body.has_more || !body.last_id) break;
    afterId = body.last_id;
  }
  return all;
}

async function fetchXaiModels(apiKey: string): Promise<Array<{ id: string; createdAt?: string }>> {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
  let res = await fetch(XAI_LANGUAGE_URL, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    res = await fetch(XAI_MODELS_URL, { headers, signal: AbortSignal.timeout(15_000) });
  }
  if (!res.ok) throw new Error(`xAI list models failed: ${res.status}`);
  const body = (await res.json()) as {
    models?: Array<{ id: string; created?: number }>;
    data?: Array<{ id: string }>;
  };
  const list = body.models ?? body.data ?? [];
  return list.map((m) => {
    const created = "created" in m && typeof m.created === "number" ? m.created : undefined;
    return {
      id: m.id,
      createdAt: created ? new Date(created * 1000).toISOString() : undefined,
    };
  });
}

type Fetcher = (key: string) => Promise<Array<{ id: string; createdAt?: string }>>;

const FETCHERS: Record<ProviderName, Fetcher> = {
  openai: fetchOpenAiModels,
  anthropic: fetchAnthropicModels,
  xai: fetchXaiModels,
};

export class ModelRegistry {
  private snapshot: ModelRegistrySnapshot = emptyRegistry();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly keys: Partial<Record<ProviderName, string>>,
    private readonly refreshMinutes = 15
  ) {}

  start(): void {
    void this.refreshAll();
    this.timer = setInterval(() => void this.refreshAll(), this.refreshMinutes * 60_000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  getSnapshot(): ModelRegistrySnapshot {
    return this.snapshot;
  }

  findModel(modelId: string): DiscoveredModel | undefined {
    for (const provider of Object.values(this.snapshot.providers)) {
      const hit = provider.models.find((m) => m.id === modelId);
      if (hit) return hit;
    }
    return undefined;
  }

  private async refreshProvider(provider: ProviderName): Promise<ProviderRegistryState> {
    const prev = this.snapshot.providers[provider];
    const key = this.keys[provider];
    if (!key) {
      return { models: fallbackForProvider(provider), fetchedAt: prev.fetchedAt, source: "fallback" };
    }
    try {
      const raw = await FETCHERS[provider](key);
      const models = filterProviderModels(provider, raw);
      if (models.length === 0) throw new Error("No models after filter");
      return { models, fetchedAt: new Date().toISOString(), source: "live" };
    } catch {
      if (prev.models.length > 0 && prev.source !== "fallback") {
        return { ...prev, source: "stale" };
      }
      return { models: fallbackForProvider(provider), fetchedAt: prev.fetchedAt, source: "fallback" };
    }
  }

  async refreshAll(): Promise<void> {
    const [openai, anthropic, xai] = await Promise.all([
      this.refreshProvider("openai"),
      this.refreshProvider("anthropic"),
      this.refreshProvider("xai"),
    ]);
    const all = [...openai.models, ...anthropic.models, ...xai.models];
    this.snapshot = {
      providers: { openai, anthropic, xai },
      defaultModelId: defaultModelId(all),
    };
  }
}
