export * from "./schemas.js";
export * from "./samples.js";
export * from "./dimensions.js";
export * from "./models.overrides.js";
export * from "./model-filter.js";
export * from "./model-registry.js";
export * from "./provider-client.js";
export * from "./analyze-dimension.js";
export * from "./aggregate.js";
export * from "./analyze-opportunity.js";

export interface TaskContext {
  runId: string;
  opportunity: import("./schemas.js").Opportunity;
  modelId: string;
  callbackUrl: string;
  eventsSecret: string;
  dimension?: import("./dimensions.js").DimensionName;
  renderRootTaskRunId?: string;
  keys: {
    openai?: string;
    anthropic?: string;
    xai?: string;
  };
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
