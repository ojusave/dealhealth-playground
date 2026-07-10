import type { Dashboard, DimensionResult, ProgressEvent } from "@dealhealth/core";
import type { RunActivity, RunRecord } from "./run-types.js";

const MAX_ACTIVITY_ITEMS = 100;
const DUPLICATE_WINDOW_MS = 5_000;

export interface EventApplication {
  changed: boolean;
  becameTerminal: boolean;
}

function isTerminal(record: RunRecord): boolean {
  return record.status === "completed" || record.status === "failed";
}

function isDuplicate(activity: RunActivity[], event: ProgressEvent): boolean {
  return activity.some(
    (item) =>
      item.type === event.type &&
      item.dimension === event.dimension &&
      item.attempt === event.attempt &&
      Math.abs(Date.parse(item.timestamp) - Date.parse(event.timestamp)) <
        DUPLICATE_WINDOW_MS
  );
}

function appendActivity(record: RunRecord, event: ProgressEvent): void {
  record.activity.push({
    type: event.type,
    timestamp: event.timestamp,
    dimension: event.dimension,
    attempt: event.attempt,
    taskRunId: event.taskRunId,
    message: event.message,
  });
  if (record.activity.length > MAX_ACTIVITY_ITEMS) record.activity.shift();
}

/** Apply one progress event without storage or notification side effects. */
export function applyRunEvent(
  record: RunRecord,
  event: ProgressEvent
): EventApplication {
  if (isTerminal(record)) return { changed: false, becameTerminal: false };

  const duplicate = isDuplicate(record.activity, event);
  record.updatedAt = event.timestamp;
  record.lastEventAt = event.timestamp;
  if (!duplicate) appendActivity(record, event);

  if (event.type === "aggregate:completed") {
    record.status = "completed";
    record.result = event.payload as Dashboard;
    return { changed: true, becameTerminal: true };
  }

  if (event.type === "run:failed") {
    record.status = "failed";
    record.error = event.message ?? "Run failed";
    return { changed: true, becameTerminal: true };
  }

  record.status = "running";

  if (event.type === "root:running") {
    if (!duplicate && event.taskRunId) record.renderRootTaskRunId = event.taskRunId;
    return { changed: !duplicate, becameTerminal: false };
  }

  const task = record.tasks.find((item) => item.dimension === event.dimension);
  if (!task) return { changed: !duplicate, becameTerminal: false };

  task.attempt = event.attempt;
  if (event.taskRunId) task.taskRunId = event.taskRunId;

  if (event.type === "dimension:queued") {
    task.status = "queued";
    task.queuedAt = event.timestamp;
  } else if (event.type === "dimension:running") {
    task.status = "running";
    task.startedAt ??= event.timestamp;
  } else if (event.type === "dimension:completed") {
    const result = event.payload as Partial<DimensionResult> | undefined;
    task.status = "completed";
    task.finishedAt = event.timestamp;
    if (task.startedAt) {
      task.durationMs = Date.parse(event.timestamp) - Date.parse(task.startedAt);
    }
    if (result?.score != null) task.score = result.score;
    if (result?.findings) task.findings = result.findings;
    if (result?.reasoning_steps) task.reasoning = result.reasoning_steps;
  } else if (event.type === "dimension:failed") {
    task.status = "failed";
    task.finishedAt = event.timestamp;
    task.message = event.message ?? "Dimension analysis failed";
    if (task.startedAt) {
      task.durationMs = Date.parse(event.timestamp) - Date.parse(task.startedAt);
    }
  }

  return { changed: true, becameTerminal: false };
}
