export interface ApiConfig {
  port: number;
  executionMode: "workflows" | "simulated";
  modelRefreshMinutes: number;
  eventsSecret: string;
  allowedOrigin: string;
  apiBaseUrl: string;
  workflowTaskSlug: string;
  renderApiKey?: string;
  keys: {
    openai?: string;
    anthropic?: string;
    xai?: string;
  };
}

export function loadConfig(): ApiConfig {
  const mode = process.env.EXECUTION_MODE === "workflows" ? "workflows" : "simulated";
  return {
    port: parseInt(process.env.PORT ?? "3001", 10),
    executionMode: mode,
    modelRefreshMinutes: parseInt(process.env.MODEL_REFRESH_MINUTES ?? "15", 10),
    eventsSecret: process.env.EVENTS_SECRET ?? "dev-events-secret-change-me",
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3001"}`,
    workflowTaskSlug: process.env.WORKFLOW_TASK_SLUG ?? "dealhealth-workflows/analyzeOpportunity",
    renderApiKey: process.env.RENDER_API_KEY,
    keys: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      xai: process.env.XAI_API_KEY,
    },
  };
}
