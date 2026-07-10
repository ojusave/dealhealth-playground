import { task } from "@renderinc/sdk/workflows";
import {
  analyzeOpportunityPipeline,
  runDimensionAnalysis,
  type TaskContext,
} from "@dealhealth/core";
import { reportEvent } from "./events.js";

function resolveKeys(input: TaskContext) {
  return {
    openai: input.keys?.openai ?? process.env.OPENAI_API_KEY,
    anthropic: input.keys?.anthropic ?? process.env.ANTHROPIC_API_KEY,
    xai: input.keys?.xai ?? process.env.XAI_API_KEY,
  };
}

export const analyzeDimension = task(
  {
    name: "analyzeDimension",
    plan: "starter",
    timeoutSeconds: 120,
    retry: { maxRetries: 1, waitDurationMs: 2000, backoffScaling: 2 },
  },
  async function analyzeDimension(input: TaskContext) {
    if (!input.dimension) throw new Error("dimension is required");
    return runDimensionAnalysis({
      opportunity: input.opportunity,
      modelId: input.modelId,
      dimension: input.dimension,
      keys: resolveKeys(input),
    });
  }
);

export const analyzeOpportunity = task(
  {
    name: "analyzeOpportunity",
    plan: "standard",
    timeoutSeconds: 600,
    retry: { maxRetries: 0, waitDurationMs: 1000, backoffScaling: 1 },
  },
  async function analyzeOpportunity(input: TaskContext) {
    const keys = resolveKeys(input);
    const context = { ...input, keys };
    return analyzeOpportunityPipeline({
      ctx: context,
      modelLabel: input.modelLabel,
      mode: "workflows",
      startedAt: Date.now(),
      makeTaskRunId: (dimension) => `pending-${dimension.toLowerCase().replaceAll(" ", "-")}`,
      report: (event) => reportEvent(context, event),
      executeDimension: async (dimension) =>
        analyzeDimension({
          ...context,
          dimension,
        }),
    });
  }
);
