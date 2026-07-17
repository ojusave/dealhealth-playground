import { describe, expect, it } from "vitest";
import { displayRiskSignal, uniqueRiskThemes } from "./risk-presentation";

describe("risk presentation", () => {
  it("humanizes raw deal fields", () => {
    expect(displayRiskSignal("budget_confirmed: false")).toBe("Budget unconfirmed");
    expect(displayRiskSignal("mutual_action_plan: false")).toBe(
      "Mutual action plan missing"
    );
    expect(displayRiskSignal("pilot_status: in progress")).toBe("Pilot still in progress");
  });

  it("keeps one risk per theme", () => {
    const risks = uniqueRiskThemes([
      { signal: "budget_confirmed: false", description: "No budget line." },
      { signal: "Budget unconfirmed", description: "Funding is not verified." },
      { signal: "Mutual action plan missing", description: "No shared close plan." },
    ]);

    expect(risks.map((risk) => displayRiskSignal(risk.signal))).toEqual([
      "Budget unconfirmed",
      "Mutual action plan missing",
    ]);
  });
});
