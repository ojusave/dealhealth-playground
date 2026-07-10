import {
  analyzeOpportunityPipeline,
  type ProgressEvent,
  type TaskContext,
} from "@dealhealth/core";
import type { ApiConfig } from "../config.js";
import type { RunStore } from "../run-store.js";

function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function runSimulatedAnalysis(
  config: ApiConfig,
  store: RunStore,
  runId: string,
  ctx: TaskContext,
  modelLabel: string
): Promise<void> {
  const startedAt = Date.now();
  const report = async (partial: Omit<ProgressEvent, "runId" | "timestamp">) => {
    store.applyEvent({
      runId,
      timestamp: new Date().toISOString(),
      ...partial,
    });
  };

  try {
    await analyzeOpportunityPipeline({
      ctx,
      modelLabel,
      mode: "simulated",
      startedAt,
      makeTaskRunId: (dimension) => shortId(`sim-${dimension.slice(0, 3).toLowerCase()}`),
      report,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await report({ type: "run:failed", attempt: 1, message });
  }
}
