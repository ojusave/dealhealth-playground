import { Render } from "@renderinc/sdk";
import type { TaskContext } from "@dealhealth/core";
import type { ApiConfig } from "../config.js";
import { formatRenderSdkError, formatUnknown } from "../format-error.js";
import type { RunStore } from "../run-store.js";
import { enrichFromRender } from "../render-enrich.js";

export async function triggerWorkflowRun(
  config: ApiConfig,
  store: RunStore,
  runId: string,
  ctx: TaskContext
): Promise<void> {
  if (!config.renderApiKey) {
    store.markFailed(
      runId,
      "RENDER_API_KEY is missing on dealhealth-api. Create one in the Render Dashboard and redeploy the API."
    );
    return;
  }

  const render = new Render({ token: config.renderApiKey });
  try {
    console.log(`[workflows] Starting ${config.workflowTaskSlug} for run ${runId}`);
    const started = await render.workflows.startTask(config.workflowTaskSlug, [ctx]);
    console.log(`[workflows] Started task run ${started.taskRunId} for ${runId}`);

    const record = store.get(runId);
    if (record) record.renderRootTaskRunId = started.taskRunId;

    store.applyEvent({
      runId,
      type: "root:running",
      timestamp: new Date().toISOString(),
      attempt: 1,
      taskRunId: started.taskRunId,
    });

    // Keep reconciling from Render even if callback events are delayed or dropped.
    void (async () => {
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const current = store.get(runId);
        if (!current || current.status === "completed" || current.status === "failed") return;
        await enrichFromRender(store, config.renderApiKey!, runId, started.taskRunId);
        try {
          const details = await render.workflows.getTaskRun(started.taskRunId);
          if (details.status === "completed" && details.results?.[0] && !current.result) {
            store.applyEvent({
              runId,
              type: "aggregate:completed",
              timestamp: new Date().toISOString(),
              attempt: 1,
              payload: details.results[0],
            });
            return;
          }
          if (details.status === "failed" || details.status === "canceled") {
            store.markFailed(
              runId,
              formatUnknown(details.error) ||
                "The workflow run failed. Check the Render Dashboard for details."
            );
            return;
          }
        } catch (err) {
          console.warn(`[workflows] reconcile failed for ${runId}:`, formatRenderSdkError(err));
        }
      }
    })();
  } catch (err) {
    const detail = formatRenderSdkError(err);
    store.markFailed(
      runId,
      `Could not start workflow: ${detail}. Verify WORKFLOW_TASK_SLUG and that dealhealth-workflows is deployed.`
    );
  }
}
