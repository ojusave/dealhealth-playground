import type { ProgressEvent, TaskContext } from "@dealhealth/core";

function shortRunId(dimension?: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return dimension ? `trn-${dimension.slice(0, 3).toLowerCase()}-${suffix}` : `trn-root-${suffix}`;
}

/** POST progress to the API. Idempotent-friendly via timestamp + attempt. */
export async function reportEvent(
  input: TaskContext,
  partial: Omit<ProgressEvent, "runId" | "timestamp"> & { taskRunId?: string }
): Promise<void> {
  const event: ProgressEvent = {
    runId: input.runId,
    timestamp: new Date().toISOString(),
    taskRunId: partial.taskRunId ?? shortRunId(input.dimension),
    ...partial,
  };

  const res = await fetch(input.callbackUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.eventsSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.warn(`[events] ${res.status} posting ${event.type}`);
  }
}

export function safeMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
