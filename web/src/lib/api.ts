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

export interface ModelEntry {
  id: string;
  label: string;
  tier: string;
  default?: boolean;
  isNew?: boolean;
}

export interface ModelsResponse {
  defaultModelId: string;
  providers: Record<
    string,
    { models: ModelEntry[]; fetchedAt: string | null; source: string }
  >;
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
  tasks: TaskNode[];
  result?: Dashboard;
  error?: string;
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

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) throw new Error("Could not load models");
  return res.json();
}

export async function fetchSamples(): Promise<Opportunity[]> {
  const res = await fetch(`${API_BASE}/api/samples`);
  if (!res.ok) throw new Error("Could not load samples");
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
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? "Analysis failed to start");
  }
  return body;
}

export function subscribeRun(
  runId: string,
  onUpdate: (snap: RunSnapshot) => void,
  onError: (msg: string) => void
): () => void {
  const es = new EventSource(`${API_BASE}/api/runs/${runId}/stream`);
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.error) {
        onError(data.error);
        es.close();
        return;
      }
      onUpdate(data);
      if (data.status === "completed" || data.status === "failed") es.close();
    } catch {
      onError("Could not read run updates");
      es.close();
    }
  };
  es.onerror = () => {
    void fetch(`${API_BASE}/api/runs/${runId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(onUpdate)
      .catch(() => onError("Connection lost. Refresh or analyze again."));
    es.close();
  };
  return () => es.close();
}
