import { formatRenderSdkError, formatUnknown } from "./format-error.js";
import type { RunStore } from "./run-store.js";
import type { WorkflowClient, WorkflowRunDetails } from "./workflow-client.js";

const DEFAULT_INTERVAL_MS = 2_000;

function inputDimension(input: unknown): string | undefined {
  const value = Array.isArray(input) ? input[0] : input;
  if (!value || typeof value !== "object" || !("dimension" in value)) return undefined;
  return (value as { dimension?: string }).dimension;
}

/** Owns polling and recovery for every active Render workflow run. */
export class WorkflowReconciler {
  private readonly tracked = new Map<string, string>();
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly store: RunStore,
    private readonly client: WorkflowClient,
    private readonly intervalMs = DEFAULT_INTERVAL_MS
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.reconcileAll(), this.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  track(runId: string, rootTaskRunId: string): void {
    this.tracked.set(runId, rootTaskRunId);
  }

  async reconcileAll(): Promise<void> {
    await Promise.all(
      [...this.tracked].map(([runId, rootTaskRunId]) =>
        this.reconcile(runId, rootTaskRunId)
      )
    );
  }

  private async reconcile(runId: string, rootTaskRunId: string): Promise<void> {
    const record = this.store.get(runId);
    if (!record || record.status === "completed" || record.status === "failed") {
      this.tracked.delete(runId);
      return;
    }

    try {
      await this.enrichTasks(runId, rootTaskRunId);
      const root = await this.client.getTaskRun(rootTaskRunId);
      if (root.status === "completed" && root.results?.[0]) {
        this.store.applyEvent({
          runId,
          type: "aggregate:completed",
          timestamp: new Date().toISOString(),
          attempt: 1,
          payload: root.results[0],
        });
        this.tracked.delete(runId);
      } else if (root.status === "failed" || root.status === "canceled") {
        this.store.markFailed(
          runId,
          formatUnknown(root.error) ||
            "The workflow run failed. Check the Render Dashboard for details."
        );
        this.tracked.delete(runId);
      }
    } catch (error) {
      console.warn(`[workflows] reconcile failed for ${runId}:`, formatRenderSdkError(error));
    }
  }

  private async enrichTasks(runId: string, rootTaskRunId: string): Promise<void> {
    const runs = await this.client.listTaskRuns(rootTaskRunId);
    await Promise.all(
      runs
        .filter((run) => run.id !== rootTaskRunId)
        .map(async (run) => {
          const details = await this.client.getTaskRun(run.id);
          this.applyTaskDetails(runId, run, details);
        })
    );
  }

  private applyTaskDetails(
    runId: string,
    run: { id: string; retries?: number; startedAt?: string; completedAt?: string },
    details: WorkflowRunDetails
  ): void {
    const dimension = inputDimension(details.input);
    if (!dimension) return;
    this.store.updateTaskMetadata(runId, dimension, {
      taskRunId: run.id,
      attempt: (run.retries ?? 0) + 1,
      startedAt: run.startedAt,
      finishedAt: run.completedAt,
    });
  }
}
