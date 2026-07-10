import { Render } from "@renderinc/sdk";
import type { RunStore } from "./run-store.js";

function taskInputDimension(input: unknown): string | undefined {
  if (Array.isArray(input)) {
    const first = input[0] as { dimension?: string } | undefined;
    return first?.dimension;
  }
  if (input && typeof input === "object" && "dimension" in input) {
    return (input as { dimension?: string }).dimension;
  }
  return undefined;
}

/** Enrich dimension task nodes with real Render task run IDs via listTaskRuns. */
export async function enrichFromRender(
  store: RunStore,
  renderApiKey: string,
  runId: string,
  rootTaskRunId: string
): Promise<void> {
  const render = new Render({ token: renderApiKey });
  try {
    const runs = await render.workflows.listTaskRuns({
      rootTaskRunId: [rootTaskRunId],
      limit: 20,
    });
    const record = store.get(runId);
    if (!record) return;

    for (const entry of runs) {
      const run = entry.taskRun;
      if (run.id === rootTaskRunId) continue;

      const details = await render.workflows.getTaskRun(run.id);
      const dimension = taskInputDimension(details.input);
      const match = dimension
        ? record.tasks.find((t) => t.dimension === dimension)
        : record.tasks.find((t) => !t.taskRunId?.startsWith("trn-"));
      if (!match) continue;

      match.taskRunId = run.id;
      match.attempt = (run.retries ?? 0) + 1;
      if (run.startedAt && !match.startedAt) match.startedAt = run.startedAt;
      if (run.completedAt && !match.finishedAt) {
        match.finishedAt = run.completedAt;
        if (match.startedAt) {
          match.durationMs = Date.parse(run.completedAt) - Date.parse(match.startedAt);
        }
      }
    }
  } catch {
    // Non-critical enrichment
  }
}

export async function pollStaleRuns(
  store: RunStore,
  renderApiKey?: string
): Promise<void> {
  for (const stale of store.staleRuns()) {
    if (!renderApiKey || !stale.renderRootTaskRunId) {
      store.markFailed(stale.runId, "This run stopped reporting progress. Hit Analyze again.");
      continue;
    }
    const render = new Render({ token: renderApiKey });
    try {
      const details = await render.workflows.getTaskRun(stale.renderRootTaskRunId);
      if (details.status === "failed" || details.status === "canceled") {
        store.markFailed(
          stale.runId,
          details.error ?? "The workflow run failed. Check the Render Dashboard for details."
        );
      } else if (details.status === "completed" && details.results?.[0]) {
        store.applyEvent({
          runId: stale.runId,
          type: "aggregate:completed",
          timestamp: new Date().toISOString(),
          attempt: 1,
          payload: details.results[0],
        });
      }
    } catch {
      store.markFailed(stale.runId, "This run expired. Hit Analyze again.");
    }
  }
}
