import type { DimensionName } from "./dimensions.js";
import type { Dashboard, Opportunity } from "./schemas.js";

export interface ProviderKeys {
  openai?: string;
  anthropic?: string;
  xai?: string;
}

export type ExecutionMode = "workflows" | "simulated";

export interface TaskContext {
  runId: string;
  opportunity: Opportunity;
  modelId: string;
  modelLabel: string;
  callbackUrl: string;
  eventsSecret: string;
  dimension?: DimensionName;
  renderRootTaskRunId?: string;
  keys: ProviderKeys;
}

export type ProgressEventType =
  | "root:running"
  | "dimension:queued"
  | "dimension:running"
  | "dimension:completed"
  | "dimension:failed"
  | "aggregate:completed"
  | "run:failed";

export interface ProgressEvent {
  runId: string;
  type: ProgressEventType;
  dimension?: string;
  timestamp: string;
  attempt: number;
  taskRunId?: string;
  payload?: unknown;
  message?: string;
}

export type TaskStatus = "queued" | "running" | "completed" | "failed";
export type RunStatus = TaskStatus;

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
  type: ProgressEventType;
  timestamp: string;
  dimension?: string;
  attempt: number;
  taskRunId?: string;
  message?: string;
}

export interface RunSnapshot {
  status: RunStatus;
  modelId: string;
  mode: ExecutionMode;
  queuedAt: string;
  lastEventAt: string;
  renderRootTaskRunId?: string;
  tasks: TaskNodeState[];
  activity: RunActivity[];
  result?: Dashboard;
  error?: string;
}
