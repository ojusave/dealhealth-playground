import type { TaskContext } from "@dealhealth/core";
import type { ApiConfig } from "../config.js";
import { formatRenderSdkError } from "../format-error.js";
import type { RunStore } from "../run-store.js";
import type { WorkflowClient } from "../workflow-client.js";
import type { WorkflowReconciler } from "../workflow-reconciler.js";

export async function triggerWorkflowRun(
  config: ApiConfig,
  store: RunStore,
  client: WorkflowClient,
  reconciler: WorkflowReconciler,
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

  try {
    console.log(`[workflows] Starting ${config.workflowTaskSlug} for run ${runId}`);
    const started = await client.startTask(config.workflowTaskSlug, [ctx]);
    console.log(`[workflows] Started task run ${started.taskRunId} for ${runId}`);

    store.setRootTaskRunId(runId, started.taskRunId);

    store.applyEvent({
      runId,
      type: "root:running",
      timestamp: new Date().toISOString(),
      attempt: 1,
      taskRunId: started.taskRunId,
    });
    reconciler.track(runId, started.taskRunId);
  } catch (err) {
    const detail = formatRenderSdkError(err);
    store.markFailed(
      runId,
      `Could not start workflow: ${detail}. Verify WORKFLOW_TASK_SLUG and that dealhealth-workflows is deployed.`
    );
  }
}
