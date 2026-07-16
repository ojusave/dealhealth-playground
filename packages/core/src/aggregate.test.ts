import { describe, expect, it } from "vitest";
import type { Dashboard } from "./schemas.js";
import { selectTopRisks, workflowOnlyRisks } from "./aggregate.js";

describe("selectTopRisks", () => {
  it("returns three severity-ranked risks without repeating the same underlying gap", () => {
    const risks: Dashboard["risks"] = [
      {
        severity: "Medium",
        signal: "18 days since last touch",
        description: "Engagement has stalled.",
        dimension: "Momentum",
      },
      {
        severity: "High",
        signal: "budget_confirmed: false",
        description: "No budget line is confirmed.",
        dimension: "Qualification",
      },
      {
        severity: "High",
        signal: "No confirmed budget line",
        description: "Pricing and procurement cannot advance.",
        dimension: "Commercial Readiness",
      },
      {
        severity: "High",
        signal: "mutual_action_plan: false",
        description: "There are no dated milestones or owners.",
        dimension: "Execution Alignment",
      },
      {
        severity: "High",
        signal: "exec_sponsor_engaged: false",
        description: "Executive alignment is missing.",
        dimension: "Execution Alignment",
      },
    ];

    const selected = selectTopRisks(risks);

    expect(selected).toHaveLength(3);
    expect(selected.map((risk) => risk.signal)).toEqual([
      "budget_confirmed: false",
      "mutual_action_plan: false",
      "exec_sponsor_engaged: false",
    ]);
  });

  it("identifies risk themes that only the specialist workflow surfaced", () => {
    const workflowRisks: Dashboard["risks"] = [
      {
        severity: "High",
        signal: "budget_confirmed: false",
        description: "No budget line is confirmed.",
        dimension: "Qualification",
      },
      {
        severity: "High",
        signal: "mutual_action_plan: false",
        description: "There are no dated milestones or owners.",
        dimension: "Execution Alignment",
      },
    ];

    expect(
      workflowOnlyRisks(workflowRisks, [
        {
          signal: "No confirmed funding",
          description: "The budget path is unclear.",
        },
      ]).map((risk) => risk.signal)
    ).toEqual(["mutual_action_plan: false"]);
  });
});
