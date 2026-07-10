import type {
  Dashboard,
  Opportunity,
  RunActivity,
  RunSnapshot,
  TaskNodeState,
} from "@dealhealth/core";

export type { Dashboard, Opportunity, RunActivity, RunSnapshot };
export type TaskNode = TaskNodeState;

export function renderSignupUrlWithUtms(content: string = "footer_link"): string {
  const params = new URLSearchParams({
    utm_source: "github",
    utm_medium: "referral",
    utm_campaign: "ojus_demos",
    utm_content: content,
  });
  return `https://dashboard.render.com/register?${params.toString()}`;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface AppError {
  title: string;
  message: string;
  hint?: string;
  code?: string;
}

export interface ModelEntry {
  id: string;
  label: string;
  tier: string;
  default?: boolean;
  isNew?: boolean;
}

export interface ProviderCatalog {
  configured: boolean;
  models: ModelEntry[];
  fetchedAt: string | null;
  source: "live" | "stale" | "unavailable";
  error?: string;
}

export interface ModelsResponse {
  defaultModelId: string;
  configuredProviders: string[];
  providers: Record<string, ProviderCatalog>;
}

type ApiErrorBody = {
  error?: string;
  hint?: string;
  code?: string;
  retryAfter?: number;
};

async function parseApiError(res: Response, fallbackTitle: string): Promise<AppError> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  const message = body.error ?? `Request failed (${res.status}).`;
  let hint = body.hint;
  if (res.status === 429 && body.retryAfter) {
    hint = `Wait ${body.retryAfter} seconds, then try again.`;
  }
  if (res.status === 0 || res.status >= 500) {
    hint = hint ?? "Check that dealhealth-api is running and VITE_API_BASE_URL points to it.";
  }
  return {
    title: fallbackTitle,
    message,
    hint,
    code: body.code,
  };
}

export function catalogIssues(models: ModelsResponse): AppError | null {
  if (models.configuredProviders.length === 0) {
    return {
      title: "No provider keys",
      message: "The API has no OpenAI, Anthropic, or xAI keys configured.",
      hint: "Add at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or XAI_API_KEY on dealhealth-api.",
      code: "no_provider_keys",
    };
  }

  const selectable = Object.values(models.providers).filter(
    (p) => p.configured && p.models.length > 0
  );
  if (selectable.length > 0) return null;

  const failed = Object.entries(models.providers).filter(
    ([, p]) => p.configured && p.error
  );
  if (failed.length > 0) {
    const [name, p] = failed[0];
    return {
      title: "Model catalog unavailable",
      message: p.error ?? `Could not load models from ${name}.`,
      hint: "Verify the provider API key on dealhealth-api and check API logs.",
      code: "catalog_fetch_failed",
    };
  }

  return {
    title: "No models available",
    message: "Configured providers returned no models matching the demo filters.",
    hint: "Check API logs or loosen PROVIDER_INCLUDE_PATTERNS in packages/core.",
    code: "catalog_empty",
  };
}

export function selectableProviders(models: ModelsResponse): Array<[string, ProviderCatalog]> {
  return Object.entries(models.providers).filter(
    ([, group]) => group.configured && group.models.length > 0
  );
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) throw await parseApiError(res, "Could not load models");
  return res.json();
}

export async function fetchSamples(): Promise<Opportunity[]> {
  const res = await fetch(`${API_BASE}/api/samples`);
  if (!res.ok) throw await parseApiError(res, "Could not load samples");
  return res.json();
}

export async function startAnalysis(
  opportunity: Opportunity,
  modelId: string
): Promise<{ runId: string }> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunity, modelId }),
  });
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody & { runId?: string };
  if (!res.ok) {
    throw {
      title: "Analysis did not start",
      message: body.error ?? "The API rejected the request.",
      hint: body.hint,
      code: body.code,
    } satisfies AppError;
  }
  return { runId: body.runId! };
}

async function fetchRunSnapshot(runId: string): Promise<RunSnapshot> {
  const res = await fetch(`${API_BASE}/api/runs/${runId}`);
  if (!res.ok) throw await parseApiError(res, "Could not load run");
  return res.json();
}

function handleSnapshot(
  snap: RunSnapshot,
  onUpdate: (snap: RunSnapshot) => void,
  onError: (err: AppError) => void
): boolean {
  onUpdate(snap);
  if (snap.status === "failed" && snap.error) {
    onError({
      title: "Analysis failed",
      message: snap.error,
      hint: "Check workflow logs on Render and provider keys on dealhealth-workflows.",
      code: "run_failed",
    });
  }
  return snap.status === "completed" || snap.status === "failed";
}

/**
 * Follow a run until it finishes.
 * Polling is the source of truth; SSE is an optional fast path.
 * Previous EventSource-only flow closed on the first stream error and left the UI stuck on queued.
 */
export function subscribeRun(
  runId: string,
  onUpdate: (snap: RunSnapshot) => void,
  onError: (err: AppError) => void
): () => void {
  let stopped = false;
  let es: EventSource | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    es?.close();
    es = null;
  };

  const apply = (snap: RunSnapshot) => {
    if (stopped) return;
    if (handleSnapshot(snap, onUpdate, onError)) stop();
  };

  const poll = async () => {
    if (stopped) return;
    try {
      const snap = await fetchRunSnapshot(runId);
      apply(snap);
    } catch (err) {
      if (stopped) return;
      const appErr = (err as AppError)?.title
        ? (err as AppError)
        : {
            title: "Connection lost",
            message: "Could not refresh run status from the API.",
            hint: "The workflow may still finish on Render. Refresh and try again.",
          };
      // Keep polling through transient errors; only surface once if we never recover.
      if (!pollTimer) onError(appErr);
    }
  };

  void poll();
  pollTimer = setInterval(() => void poll(), 1500);

  try {
    es = new EventSource(`${API_BASE}/api/runs/${runId}/stream`);
    es.onmessage = (ev) => {
      if (stopped) return;
      try {
        const data = JSON.parse(ev.data) as RunSnapshot & { error?: string };
        if (data.error) {
          onError({
            title: "Run expired",
            message: data.error,
            hint: "Start a new analysis from the controls above.",
          });
          stop();
          return;
        }
        apply(data);
      } catch {
        // Ignore malformed SSE frames; polling continues.
      }
    };
    es.onerror = () => {
      // Do not stop. Polling remains the reliable path across CORS/proxy SSE drops.
      es?.close();
      es = null;
    };
  } catch {
    // EventSource unavailable; polling alone is enough.
  }

  return stop;
}
