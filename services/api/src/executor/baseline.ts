import { runBaselineAnalysis, type TaskContext } from "@dealhealth/core";
import type { RunStore } from "../run-store.js";

export async function runSingleCallBaseline(
  store: RunStore,
  runId: string,
  ctx: TaskContext,
  modelLabel: string
): Promise<void> {
  store.markBaselineRunning(runId);
  try {
    const result = await runBaselineAnalysis({
      opportunity: ctx.opportunity,
      modelId: ctx.modelId,
      modelLabel,
      keys: ctx.keys,
    });
    store.setBaselineResult(runId, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.markBaselineFailed(runId, message);
  }
}
