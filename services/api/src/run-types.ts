import type {
  ExecutionMode,
  RunActivity,
  RunSnapshot,
  RunStatus,
  TaskNodeState,
} from "@dealhealth/core";

export type { RunActivity, RunSnapshot, RunStatus, TaskNodeState };

export interface RunRecord extends RunSnapshot {
  runId: string;
  mode: ExecutionMode;
  updatedAt: string;
  listeners: Set<(snapshot: RunSnapshot) => void>;
}

export interface TaskMetadata {
  taskRunId: string;
  attempt: number;
  startedAt?: string;
  finishedAt?: string;
}
