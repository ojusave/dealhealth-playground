import { describe, expect, it } from "vitest";
import type { Dashboard } from "@dealhealth/core";
import { RunStore } from "./run-store.js";
import type {
  WorkflowClient,
  WorkflowRunDetails,
  WorkflowRunSummary,
} from "./workflow-client.js";
import { WorkflowReconciler } from "./workflow-reconciler.js";

describe("WorkflowReconciler", () => {
  it("enriches child metadata and completes from the root result", async () => {
    const store = createStore();
    const client = new FakeWorkflowClient(
      { status: "completed", results: [{} as Dashboard] },
      [{ id: "child-1", retries: 1, startedAt: "2026-07-10T12:00:00Z" }],
      { status: "completed", input: [{ dimension: "Momentum" }] }
    );
    const reconciler = new WorkflowReconciler(store, client);

    reconciler.track("run-1", "root-1");
    await reconciler.reconcileAll();

    const snapshot = store.snapshot("run-1");
    expect(snapshot?.status).toBe("completed");
    expect(snapshot?.tasks[0]?.taskRunId).toBe("child-1");
    expect(snapshot?.tasks[0]?.attempt).toBe(2);
  });

  it("marks failed root runs with the Render error", async () => {
    const store = createStore();
    const client = new FakeWorkflowClient(
      { status: "failed", error: { message: "provider rejected request" } },
      [],
      { status: "pending" }
    );
    const reconciler = new WorkflowReconciler(store, client);

    reconciler.track("run-1", "root-1");
    await reconciler.reconcileAll();

    expect(store.snapshot("run-1")?.status).toBe("failed");
    expect(store.snapshot("run-1")?.error).toBe("provider rejected request");
  });
});

class FakeWorkflowClient implements WorkflowClient {
  constructor(
    private readonly root: WorkflowRunDetails,
    private readonly children: WorkflowRunSummary[],
    private readonly child: WorkflowRunDetails
  ) {}

  async startTask(): Promise<{ taskRunId: string }> {
    return { taskRunId: "root-1" };
  }

  async getTaskRun(taskRunId: string): Promise<WorkflowRunDetails> {
    return taskRunId === "root-1" ? this.root : this.child;
  }

  async listTaskRuns(): Promise<WorkflowRunSummary[]> {
    return this.children;
  }
}

function createStore(): RunStore {
  const store = new RunStore();
  store.create({ runId: "run-1", modelId: "model", mode: "workflows" });
  return store;
}
