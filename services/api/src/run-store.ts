import type { Dashboard, ProgressEvent } from "@dealhealth/core";
import { DIMENSIONS } from "@dealhealth/core";

export type TaskStatus = "queued" | "running" | "completed" | "failed";

export interface TaskNodeState {
  dimension: string;
  status: TaskStatus;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  attempt: number;
  taskRunId?: string;
  score?: number;
  message?: string;
  findings?: string;
  reasoning?: string[];
}

export interface RunActivity {
  type: ProgressEvent["type"];
  timestamp: string;
  dimension?: string;
  attempt: number;
  taskRunId?: string;
  message?: string;
}

export interface RunRecord {
  runId: string;
  status: "queued" | "running" | "completed" | "failed";
  modelId: string;
  mode: "workflows" | "simulated";
  queuedAt: string;
  updatedAt: string;
  lastEventAt: string;
  renderRootTaskRunId?: string;
  tasks: TaskNodeState[];
  activity: RunActivity[];
  result?: Dashboard;
  error?: string;
  listeners: Set<(snapshot: RunSnapshot) => void>;
}

export interface RunSnapshot {
  status: RunRecord["status"];
  modelId: string;
  mode: RunRecord["mode"];
  queuedAt: string;
  lastEventAt: string;
  renderRootTaskRunId?: string;
  tasks: TaskNodeState[];
  activity: RunActivity[];
  result?: Dashboard;
  error?: string;
}

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
    mode: "workflows" | "simulated";
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

    const now = event.timestamp;
    record.updatedAt = now;
    record.lastEventAt = now;
    if (event.type !== "run:failed" && event.type !== "aggregate:completed") {
      record.status = "running";
    }
    record.activity.push({
      type: event.type,
      timestamp: event.timestamp,
      dimension: event.dimension,
      attempt: event.attempt,
      taskRunId: event.taskRunId,
      message: event.message,
    });
    if (record.activity.length > 100) record.activity.shift();

    if (event.type === "root:running") {
      if (event.taskRunId) record.renderRootTaskRunId = event.taskRunId;
      this.notify(record);
      return;
    }

    if (event.type.startsWith("dimension:")) {
      const task = record.tasks.find((t) => t.dimension === event.dimension);
      if (!task) return;
      task.attempt = event.attempt;
      if (event.taskRunId) task.taskRunId = event.taskRunId;

      if (event.type === "dimension:queued") {
        task.status = "queued";
        task.queuedAt = now;
      } else if (event.type === "dimension:running") {
        task.status = "running";
        task.startedAt = task.startedAt ?? now;
      } else if (event.type === "dimension:completed") {
        task.status = "completed";
        task.finishedAt = now;
        if (task.startedAt) {
          task.durationMs = Date.parse(now) - Date.parse(task.startedAt);
        }
        const payload = event.payload as { score?: number; findings?: string; reasoning_steps?: string[] };
        if (payload?.score != null) task.score = payload.score;
        if (payload?.findings) task.findings = payload.findings;
        if (payload?.reasoning_steps) task.reasoning = payload.reasoning_steps;
      } else if (event.type === "dimension:failed") {
        task.status = "failed";
        task.finishedAt = now;
        task.message = event.message ?? "Dimension analysis failed";
        if (task.startedAt) {
          task.durationMs = Date.parse(now) - Date.parse(task.startedAt);
        }
      }
      this.notify(record);
      return;
    }

    if (event.type === "aggregate:completed") {
      record.status = "completed";
      record.result = event.payload as Dashboard;
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.notify(record);
      return;
    }

    if (event.type === "run:failed") {
      record.status = "failed";
      record.error = event.message ?? "Run failed";
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.notify(record);
    }
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

  staleRuns(): Array<{ runId: string; renderRootTaskRunId?: string; lastEventAt: string }> {
    // Recover sooner: SSE drops and missed callbacks should not leave the UI queued forever.
    const cutoff = Date.now() - 20_000;
    const out: Array<{ runId: string; renderRootTaskRunId?: string; lastEventAt: string }> = [];
    for (const record of this.runs.values()) {
      if (
        (record.status === "running" || record.status === "queued") &&
        Date.parse(record.lastEventAt) < cutoff
      ) {
        out.push({
          runId: record.runId,
          renderRootTaskRunId: record.renderRootTaskRunId,
          lastEventAt: record.lastEventAt,
        });
      }
    }
    return out;
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
