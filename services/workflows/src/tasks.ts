import { task } from "@renderinc/sdk/workflows";
import {
  aggregateResults,
  DIMENSIONS,
  resolveProvider,
  runDimensionAnalysis,
  type DimensionName,
  type TaskContext,
} from "@dealhealth/core";
import { reportEvent, safeMessage } from "./events.js";

export const analyzeDimension = task(
  {
    name: "analyzeDimension",
    plan: "starter",
    timeoutSeconds: 120,
    retry: { maxRetries: 1, waitDurationMs: 2000, backoffScaling: 2 },
  },
  async function analyzeDimension(input: TaskContext) {
    if (!input.dimension) throw new Error("dimension is required");
    const attempt = 1;
    await reportEvent(input, { type: "dimension:running", dimension: input.dimension, attempt });
    try {
      const result = await runDimensionAnalysis({
        opportunity: input.opportunity,
        modelId: input.modelId,
        dimension: input.dimension as DimensionName,
        keys: {
          openai: process.env.OPENAI_API_KEY,
          anthropic: process.env.ANTHROPIC_API_KEY,
          xai: process.env.XAI_API_KEY,
        },
      });
      await reportEvent(input, {
        type: "dimension:completed",
        dimension: input.dimension,
        attempt,
        payload: result,
      });
      return result;
    } catch (err) {
      await reportEvent(input, {
        type: "dimension:failed",
        dimension: input.dimension,
        attempt,
        message: safeMessage(err),
      });
      throw err;
    }
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
    const startedAt = Date.now();
    const keys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      xai: process.env.XAI_API_KEY,
    };
    const provider = resolveProvider(input.modelId) ?? "unknown";

    await reportEvent(input, { type: "root:running", attempt: 1, taskRunId: input.renderRootTaskRunId });

    for (const dimension of DIMENSIONS) {
      await reportEvent(input, { type: "dimension:queued", dimension, attempt: 1 });
    }

    const settled = await Promise.allSettled(
      DIMENSIONS.map((dimension) =>
        analyzeDimension({
          ...input,
          dimension,
          keys: {},
        })
      )
    );

    const dashboard = await aggregateResults({
      opportunity: input.opportunity,
      modelId: input.modelId,
      modelLabel: input.modelId,
      provider,
      mode: "workflows",
      startedAt,
      settled,
      keys,
    });

    await reportEvent(input, { type: "aggregate:completed", attempt: 1, payload: dashboard });
    return dashboard;
  }
);
