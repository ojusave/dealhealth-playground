import { describe, expect, it } from "vitest";
import { DIMENSIONS, type Dashboard, type ProgressEvent } from "@dealhealth/core";
import { applyRunEvent } from "./apply-run-event.js";
import type { RunRecord } from "./run-types.js";

describe("applyRunEvent", () => {
  it("suppresses duplicate activity entries", () => {
    const record = makeRecord();
    const event = progress("root:running");

    expect(applyRunEvent(record, event).changed).toBe(true);
    expect(
      applyRunEvent(record, {
        ...event,
        timestamp: new Date(Date.parse(event.timestamp) + 1_000).toISOString(),
      }).changed
    ).toBe(false);
    expect(record.activity).toHaveLength(1);
  });

  it("keeps terminal state idempotent when late events arrive", () => {
    const record = makeRecord();
    const completed = applyRunEvent(record, {
      ...progress("aggregate:completed"),
      payload: {} as Dashboard,
    });

    expect(completed.becameTerminal).toBe(true);
    expect(applyRunEvent(record, progress("dimension:running")).changed).toBe(false);
    expect(applyRunEvent(record, progress("run:failed")).becameTerminal).toBe(false);
    expect(record.status).toBe("completed");
  });
});

function makeRecord(): RunRecord {
  const now = new Date().toISOString();
  return {
    runId: "run-1",
    status: "queued",
    modelId: "openai/test",
    mode: "workflows",
    queuedAt: now,
    updatedAt: now,
    lastEventAt: now,
    tasks: DIMENSIONS.map((dimension) => ({
      dimension,
      status: "queued",
      attempt: 1,
    })),
    activity: [],
    listeners: new Set(),
  };
}

function progress(type: ProgressEvent["type"]): ProgressEvent {
  return {
    runId: "run-1",
    type,
    dimension: type.startsWith("dimension:") ? "Momentum" : undefined,
    timestamp: "2026-07-10T12:00:00.000Z",
    attempt: 1,
  };
}
