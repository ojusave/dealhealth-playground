import { describe, expect, it } from "vitest";
import type { Dashboard } from "@dealhealth/core";
import { RunStore } from "./run-store.js";

describe("RunStore", () => {
  it("decrements active runs only once for duplicate terminal events", () => {
    const store = new RunStore();
    store.create({ runId: "run-1", modelId: "model", mode: "workflows" });
    store.create({ runId: "run-2", modelId: "model", mode: "workflows" });
    store.markBaselineFailed("run-1", "not part of this test");

    const event = {
      runId: "run-1",
      type: "aggregate:completed" as const,
      timestamp: new Date().toISOString(),
      attempt: 1,
      payload: {} as Dashboard,
    };
    store.applyEvent(event);
    store.applyEvent(event);

    expect(store.getActiveCount()).toBe(1);
    expect(store.snapshot("run-1")?.status).toBe("completed");
  });

  it("waits for both the workflow result and single-call baseline", () => {
    const store = new RunStore();
    store.create({ runId: "run-1", modelId: "model", mode: "workflows" });

    store.applyEvent({
      runId: "run-1",
      type: "aggregate:completed",
      timestamp: new Date().toISOString(),
      attempt: 1,
      payload: {} as Dashboard,
    });

    expect(store.snapshot("run-1")?.status).toBe("running");
    expect(store.getActiveCount()).toBe(1);

    store.markBaselineFailed("run-1", "Baseline unavailable");

    expect(store.snapshot("run-1")?.status).toBe("completed");
    expect(store.snapshot("run-1")?.baseline.status).toBe("failed");
    expect(store.getActiveCount()).toBe(0);
  });
});
