import { DIMENSIONS, type ExecutionMode, type ProgressEvent } from "@dealhealth/core";
import { applyRunEvent } from "./apply-run-event.js";
import type { RunRecord, RunSnapshot, TaskMetadata } from "./run-types.js";

export type { RunRecord, RunSnapshot } from "./run-types.js";

const TTL_MS = 30 * 60_000;

/** In-memory run store: acceptable for single-instance demo; lost on API restart. */
export class RunStore {
  private runs = new Map<string, RunRecord>();
  private activeCount = 0;

  getActiveCount(): number {
    return this.activeCount;
  }

  create(input: {
    runId: string;
    modelId: string;
    mode: ExecutionMode;
    renderRootTaskRunId?: string;
  }): RunRecord {
    this.purgeExpired();
    const now = new Date().toISOString();
    const record: RunRecord = {
      runId: input.runId,
      status: "queued",
      modelId: input.modelId,
      mode: input.mode,
      queuedAt: now,
      updatedAt: now,
      lastEventAt: now,
      renderRootTaskRunId: input.renderRootTaskRunId,
      tasks: DIMENSIONS.map((d) => ({
        dimension: d,
        status: "queued",
        attempt: 1,
      })),
      activity: [],
      listeners: new Set(),
    };
    this.runs.set(input.runId, record);
    this.activeCount += 1;
    return record;
  }

  get(runId: string): RunRecord | undefined {
    this.purgeExpired();
    return this.runs.get(runId);
  }

  snapshot(runId: string): RunSnapshot | null {
    const record = this.get(runId);
    if (!record) return null;
    return {
      status: record.status,
      modelId: record.modelId,
      mode: record.mode,
      queuedAt: record.queuedAt,
      lastEventAt: record.lastEventAt,
      renderRootTaskRunId: record.renderRootTaskRunId,
      tasks: record.tasks,
      activity: record.activity,
      result: record.result,
      error: record.error,
    };
  }

  subscribe(runId: string, listener: (snapshot: RunSnapshot) => void): (() => void) | null {
    const record = this.get(runId);
    if (!record) return null;
    record.listeners.add(listener);
    listener(this.snapshot(runId)!);
    return () => record.listeners.delete(listener);
  }

  private notify(record: RunRecord): void {
    const snap = this.snapshot(record.runId)!;
    for (const listener of record.listeners) listener(snap);
  }

  applyEvent(event: ProgressEvent): void {
    const record = this.runs.get(event.runId);
    if (!record) {
      console.warn(
        `[run-store] Dropped ${event.type} for unknown run ${event.runId}` +
          (event.dimension ? ` (${event.dimension})` : "")
      );
      return;
    }
    const result = applyRunEvent(record, event);
    if (result.becameTerminal) {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
    if (result.changed) this.notify(record);
  }

  markFailed(runId: string, message: string): void {
    this.applyEvent({
      runId,
      type: "run:failed",
      timestamp: new Date().toISOString(),
      attempt: 1,
      message,
    });
  }

  setRootTaskRunId(runId: string, taskRunId: string): void {
    const record = this.runs.get(runId);
    if (!record) return;
    record.renderRootTaskRunId = taskRunId;
    record.updatedAt = new Date().toISOString();
    this.notify(record);
  }

  updateTaskMetadata(runId: string, dimension: string, metadata: TaskMetadata): void {
    const record = this.runs.get(runId);
    const task = record?.tasks.find((item) => item.dimension === dimension);
    if (!record || !task) return;
    task.taskRunId = metadata.taskRunId;
    task.attempt = metadata.attempt;
    task.startedAt ??= metadata.startedAt;
    task.finishedAt ??= metadata.finishedAt;
    if (task.startedAt && task.finishedAt) {
      task.durationMs = Date.parse(task.finishedAt) - Date.parse(task.startedAt);
    }
    this.notify(record);
  }

  private purgeExpired(): void {
    const cutoff = Date.now() - TTL_MS;
    for (const [id, record] of this.runs) {
      if (Date.parse(record.updatedAt) < cutoff) {
        if (record.status === "running" || record.status === "queued") {
          this.activeCount = Math.max(0, this.activeCount - 1);
        }
        this.runs.delete(id);
      }
    }
  }
}
