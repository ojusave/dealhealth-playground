import { ClientError, ServerError, TaskRunError } from "@renderinc/sdk";

/** Turn API bodies and nested objects into a readable string. */
export function formatUnknown(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Error) return formatUnknown(value.message);
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.error === "string") return o.error;
    if (o.error != null) return formatUnknown(o.error);
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.errors) && o.errors.length > 0) {
      return o.errors.map(formatUnknown).filter(Boolean).join("; ");
    }
    try {
      const json = JSON.stringify(value);
      if (json && json !== "{}") return json;
    } catch {
      /* ignore */
    }
  }
  return String(value);
}

/** Extract a useful message from @renderinc/sdk errors (avoids "[object Object]"). */
export function formatRenderSdkError(err: unknown): string {
  if (err instanceof TaskRunError) {
    return err.taskError ?? formatUnknown(err.message);
  }
  if (err instanceof ClientError || err instanceof ServerError) {
    const detail = formatUnknown(err.response);
    if (detail) {
      return err.statusCode ? `HTTP ${err.statusCode}: ${detail}` : detail;
    }
    if (err.message.includes("[object Object]")) {
      if (err.statusCode === 401) {
        return "Unauthorized. RENDER_API_KEY on dealhealth-api is invalid or revoked.";
      }
      return err.statusCode === 404
        ? "Workflow task not found. Set WORKFLOW_TASK_SLUG to your deployed task (e.g. dealhealth-workflows/analyzeOpportunity)."
        : "Render Workflows API rejected the request. Check WORKFLOW_TASK_SLUG and that dealhealth-workflows is deployed.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return formatUnknown(err);
}
