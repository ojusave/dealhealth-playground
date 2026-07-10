import { Render } from "@renderinc/sdk";
import type { TaskContext } from "@dealhealth/core";
import type { ApiConfig } from "../config.js";
import type { RunStore } from "../run-store.js";
import { enrichFromRender } from "../render-enrich.js";

export async function triggerWorkflowRun(
  config: ApiConfig,
  store: RunStore,
  runId: string,
  ctx: TaskContext
): Promise<void> {
  if (!config.renderApiKey) {
    store.markFailed(runId, "RENDER_API_KEY is not configured for workflows mode.");
    return;
  }

  const render = new Render({ token: config.renderApiKey });
  try {
    const started = await render.workflows.startTask(config.workflowTaskSlug, [ctx]);
    store.applyEvent({
      runId,
      type: "root:running",
      timestamp: new Date().toISOString(),
      attempt: 1,
      taskRunId: started.taskRunId,
    });

    const record = store.get(runId);
    if (record) record.renderRootTaskRunId = started.taskRunId;

    void (async () => {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (!store.get(runId) || store.get(runId)?.status !== "running") return;
        await enrichFromRender(store, config.renderApiKey!, runId, started.taskRunId);
      }
    })();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    store.markFailed(runId, `Could not start workflow: ${message}`);
  }
}
