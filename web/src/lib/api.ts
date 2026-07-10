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

export interface Opportunity {
  id?: string;
  company: string;
  stage: string;
  arr: number;
  expectedCloseDate: string;
  activityLevel: number;
  daysSinceLastTouch: number;
  budgetConfirmed: boolean;
  economicBuyerIdentified: boolean;
  execSponsorEngaged: boolean;
  pilotStatus: string;
  securityReview: string;
  discoveryComplete: boolean;
  mutualActionPlan: boolean;
  competitorInDeal: boolean;
  notes: string;
}

export interface TaskNode {
  dimension: string;
  status: string;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  attempt: number;
  taskRunId?: string;
  score?: number;
  message?: string;
  findings?: string;
  reasoning?: string[];
}

export interface RunSnapshot {
  status: string;
  modelId: string;
  mode: "workflows" | "simulated";
  queuedAt: string;
  lastEventAt: string;
  renderRootTaskRunId?: string;
  tasks: TaskNode[];
  activity: RunActivity[];
  result?: Dashboard;
  error?: string;
}

export interface RunActivity {
  type:
    | "root:running"
    | "dimension:queued"
    | "dimension:running"
    | "dimension:completed"
    | "dimension:failed"
    | "aggregate:completed"
    | "run:failed";
  timestamp: string;
  dimension?: string;
  attempt: number;
  taskRunId?: string;
  message?: string;
}

export interface Dashboard {
  overall_score: number;
  status: string;
  summary: string;
  dimensions: Array<{ name: string; score: number; findings: string; failed: boolean }>;
  risks: Array<{ severity: string; signal: string; description: string; dimension: string }>;
  recommendations: string[];
  context: { deal_context: string; decision_path: string; validation_scope: string };
  reasoning: Array<{ dimension: string; steps: string[] }>;
  meta: {
    modelId: string;
    modelLabel: string;
    provider: string;
    mode: string;
    durationMs: number;
    partial: boolean;
  };
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

export function subscribeRun(
  runId: string,
  onUpdate: (snap: RunSnapshot) => void,
  onError: (err: AppError) => void
): () => void {
  const es = new EventSource(`${API_BASE}/api/runs/${runId}/stream`);
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data) as RunSnapshot & { error?: string };
      if (data.error) {
        onError({
          title: "Run expired",
          message: data.error,
          hint: "Start a new analysis from the controls above.",
        });
        es.close();
        return;
      }
      onUpdate(data);
      if (data.status === "failed" && data.error) {
        onError({
          title: "Analysis failed",
          message: data.error,
          hint: "Check workflow logs on Render and provider keys on dealhealth-workflows.",
          code: "run_failed",
        });
      }
      if (data.status === "completed" || data.status === "failed") es.close();
    } catch {
      onError({
        title: "Update error",
        message: "Could not read the live run stream.",
        hint: "Refresh the page or try again.",
      });
      es.close();
    }
  };
  es.onerror = () => {
    void fetch(`${API_BASE}/api/runs/${runId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((snap: RunSnapshot) => {
        onUpdate(snap);
        if (snap.status === "failed" && snap.error) {
          onError({
            title: "Analysis failed",
            message: snap.error,
            hint: "Check workflow logs on Render.",
            code: "run_failed",
          });
        }
      })
      .catch(() =>
        onError({
          title: "Connection lost",
          message: "Lost the live stream to this run.",
          hint: "Refresh the page. The workflow may still finish on Render.",
        })
      );
    es.close();
  };
  return () => es.close();
}
