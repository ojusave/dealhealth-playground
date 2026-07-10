import { aggregateResults } from "./aggregate.js";
import { runDimensionAnalysis } from "./analyze-dimension.js";
import { DIMENSIONS, type DimensionName } from "./dimensions.js";
import { resolveProvider } from "./model-filter.js";
import type { Dashboard, Opportunity } from "./schemas.js";
import type { ProgressEvent, TaskContext } from "./index.js";

export type EventReporter = (event: Omit<ProgressEvent, "runId" | "timestamp">) => Promise<void>;

export interface AnalyzeOpportunityOptions {
  ctx: TaskContext;
  modelLabel: string;
  mode: "workflows" | "simulated";
  report: EventReporter;
  makeTaskRunId: (dimension: DimensionName) => string;
  startedAt: number;
}

/** Shared fan-out + fan-in orchestration for simulated and workflow modes. */
export async function analyzeOpportunityPipeline(
  options: AnalyzeOpportunityOptions
): Promise<Dashboard> {
  const { ctx, modelLabel, mode, report, makeTaskRunId, startedAt } = options;
  const provider = resolveProvider(ctx.modelId) ?? "unknown";

  await report({ type: "root:running", attempt: 1, taskRunId: ctx.renderRootTaskRunId });

  for (const dimension of DIMENSIONS) {
    await report({
      type: "dimension:queued",
      dimension,
      attempt: 1,
      taskRunId: makeTaskRunId(dimension),
    });
  }

  const settled = await Promise.allSettled(
    DIMENSIONS.map(async (dimension) => {
      const taskRunId = makeTaskRunId(dimension);
      await report({ type: "dimension:running", dimension, attempt: 1, taskRunId });
      try {
        const result = await runDimensionAnalysis({
          opportunity: ctx.opportunity,
          modelId: ctx.modelId,
          dimension,
          keys: ctx.keys,
        });
        await report({
          type: "dimension:completed",
          dimension,
          attempt: 1,
          taskRunId,
          payload: result,
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await report({
          type: "dimension:failed",
          dimension,
          attempt: 1,
          taskRunId,
          message,
        });
        throw Object.assign(new Error(message), { dimension });
      }
    })
  );

  const dashboard = await aggregateResults({
    opportunity: ctx.opportunity,
    modelId: ctx.modelId,
    modelLabel,
    provider,
    mode,
    startedAt,
    settled,
    keys: ctx.keys,
  });

  await report({
    type: "aggregate:completed",
    attempt: 1,
    payload: dashboard,
  });

  return dashboard;
}
