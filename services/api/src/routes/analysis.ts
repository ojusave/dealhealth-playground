import { randomUUID } from "node:crypto";
import { Hono, type Context } from "hono";
import {
  analyzeRequestSchema,
  type ModelRegistry,
  type TaskContext,
} from "@dealhealth/core";
import type { ApiConfig } from "../config.js";
import { runSimulatedAnalysis } from "../executor/simulated.js";
import { triggerWorkflowRun } from "../executor/workflows.js";
import type { RateLimiter } from "../rate-limit.js";
import type { RunStore } from "../run-store.js";
import type { WorkflowClient } from "../workflow-client.js";
import type { WorkflowReconciler } from "../workflow-reconciler.js";

const MAX_CONCURRENT = 6;

export interface AnalysisDependencies {
  config: ApiConfig;
  store: RunStore;
  limiter: RateLimiter;
  registry: ModelRegistry;
  workflowClient?: WorkflowClient;
  reconciler?: WorkflowReconciler;
}

/** Register the endpoint that validates and dispatches analyses. */
export function registerAnalysisRoutes(
  app: Hono,
  dependencies: AnalysisDependencies
): void {
  const { config, store, limiter, registry, workflowClient, reconciler } = dependencies;

  app.post("/api/analyze", async (context) => {
    const ip =
      context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = limiter.check(ip);
    if (!limited.ok) {
      return context.json(
        {
          error: "Easy there. This public demo allows 8 analyses per 10 minutes.",
          retryAfter: limited.retryAfterSec,
        },
        429,
        { "Retry-After": String(limited.retryAfterSec) }
      );
    }
    if (store.getActiveCount() >= MAX_CONCURRENT) {
      return context.json(
        { error: "Six analyses are already running. Try again in a moment." },
        429
      );
    }

    const parsed = analyzeRequestSchema.safeParse(
      await context.req.json().catch(() => null)
    );
    if (!parsed.success) {
      return context.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        400
      );
    }

    const model = registry.findModel(parsed.data.modelId);
    if (!model) return unavailableModelResponse(context, registry, parsed.data.modelId);

    const runId = randomUUID();
    const taskContext: TaskContext = {
      runId,
      opportunity: parsed.data.opportunity,
      modelId: parsed.data.modelId,
      modelLabel: model.label,
      callbackUrl: `${config.apiBaseUrl}/internal/events`,
      eventsSecret: config.eventsSecret,
      keys: config.keys,
    };

    store.create({ runId, modelId: parsed.data.modelId, mode: config.executionMode });

    if (config.executionMode === "workflows") {
      if (!workflowClient || !reconciler) {
        store.markFailed(runId, "RENDER_API_KEY is missing on dealhealth-api.");
      } else {
        void triggerWorkflowRun(
          config,
          store,
          workflowClient,
          reconciler,
          runId,
          taskContext
        );
      }
    } else {
      void runSimulatedAnalysis(config, store, runId, taskContext, model.label);
    }

    return context.json({ runId }, 202);
  });
}

function unavailableModelResponse(
  context: Context,
  registry: ModelRegistry,
  modelId: string
) {
  if (registry.configuredProviders().length === 0) {
    return context.json(
      {
        error: "No provider API keys are configured.",
        code: "no_provider_keys",
        hint: "Add OPENAI_API_KEY, ANTHROPIC_API_KEY, or XAI_API_KEY on dealhealth-api, then redeploy.",
      },
      503
    );
  }
  if (registry.availableModels().length === 0) {
    return context.json(
      {
        error: "Model catalog is empty. Provider list endpoints failed or returned no matching models.",
        code: "catalog_empty",
        hint: "Check dealhealth-api logs and verify each provider API key can call its list-models endpoint.",
      },
      503
    );
  }
  return context.json(
    {
      error: `Model "${modelId}" is not in the live catalog.`,
      code: "model_unavailable",
      hint: "Pick a model from the dropdown for a provider you configured.",
    },
    400
  );
}
