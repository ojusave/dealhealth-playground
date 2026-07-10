import { beforeEach, describe, expect, it, vi } from "vitest";
import { DIMENSIONS, type DimensionName } from "./dimensions.js";
import type { Dashboard, DimensionResult, Opportunity } from "./schemas.js";
import type { ProgressEvent, TaskContext } from "./contracts.js";

const { aggregateResults } = vi.hoisted(() => ({ aggregateResults: vi.fn() }));
vi.mock("./aggregate.js", () => ({ aggregateResults }));

const opportunity: Opportunity = {
  company: "Acme",
  stage: "Evaluation",
  arr: 100_000,
  expectedCloseDate: "2026-09-30",
  activityLevel: 5,
  daysSinceLastTouch: 3,
  budgetConfirmed: true,
  economicBuyerIdentified: true,
  execSponsorEngaged: false,
  pilotStatus: "in progress",
  securityReview: "in progress",
  discoveryComplete: true,
  mutualActionPlan: false,
  competitorInDeal: false,
  notes: "",
};

const dashboard: Dashboard = {
  overall_score: 60,
  status: "At Risk",
  summary: "Summary",
  dimensions: [],
  risks: [],
  recommendations: ["Follow up"],
  context: { deal_context: "", decision_path: "", validation_scope: "" },
  reasoning: [],
  meta: {
    modelId: "openai/test",
    modelLabel: "Test",
    provider: "openai",
    mode: "simulated",
    durationMs: 1,
    partial: false,
  },
};

function result(dimension: DimensionName): DimensionResult {
  return {
    dimension,
    score: 60,
    findings: `${dimension} findings`,
    risks: [],
    reasoning_steps: [],
  };
}

describe("analyzeOpportunityPipeline", () => {
  beforeEach(() => {
    aggregateResults.mockReset();
    aggregateResults.mockResolvedValue(dashboard);
  });

  it("uses one ordered fan-out and fan-in event sequence", async () => {
    const { analyzeOpportunityPipeline } = await import("./analyze-opportunity.js");
    const events: Array<Omit<ProgressEvent, "runId" | "timestamp">> = [];
    const taskIds = new Map<DimensionName, string>();

    await analyzeOpportunityPipeline({
      ctx: context(),
      modelLabel: "Test",
      mode: "simulated",
      startedAt: Date.now(),
      report: async (event) => void events.push(event),
      makeTaskRunId: (dimension) => {
        const id = `task-${dimension}`;
        taskIds.set(dimension, id);
        return id;
      },
      executeDimension: async (dimension) => result(dimension),
    });

    expect(events[0]?.type).toBe("root:running");
    expect(events.slice(1, 6).map((event) => event.type)).toEqual(
      DIMENSIONS.map(() => "dimension:queued")
    );
    expect(events.at(-1)?.type).toBe("aggregate:completed");
    expect(events.filter((event) => event.type === "dimension:running")).toHaveLength(5);
    expect(events.filter((event) => event.type === "dimension:completed")).toHaveLength(5);
    expect(taskIds.size).toBe(5);
    for (const dimension of DIMENSIONS) {
      const ids = events
        .filter((event) => event.dimension === dimension)
        .map((event) => event.taskRunId);
      expect(new Set(ids)).toEqual(new Set([taskIds.get(dimension)]));
    }
  });

  it("reports one failed dimension and still aggregates settled results", async () => {
    const { analyzeOpportunityPipeline } = await import("./analyze-opportunity.js");
    const events: Array<Omit<ProgressEvent, "runId" | "timestamp">> = [];

    await analyzeOpportunityPipeline({
      ctx: context(),
      modelLabel: "Test",
      mode: "simulated",
      startedAt: Date.now(),
      report: async (event) => void events.push(event),
      makeTaskRunId: (dimension) => `task-${dimension}`,
      executeDimension: async (dimension) => {
        if (dimension === "Momentum") throw new Error("provider unavailable");
        return result(dimension);
      },
    });

    expect(events.filter((event) => event.type === "dimension:failed")).toHaveLength(1);
    const settled = aggregateResults.mock.calls[0]?.[0].settled;
    expect(settled.filter((item: PromiseSettledResult<DimensionResult>) => item.status === "rejected"))
      .toHaveLength(1);
  });
});

function context(): TaskContext {
  return {
    runId: "run-1",
    opportunity,
    modelId: "openai/test",
    modelLabel: "Test",
    callbackUrl: "https://example.com/events",
    eventsSecret: "secret",
    keys: {},
  };
}
