import type { DimensionName } from "./dimensions.js";
import { callModel } from "./provider-client.js";
import {
  SYNTHESIS_JSON_SCHEMA,
  synthesisResultSchema,
  type Dashboard,
  type DimensionResult,
  type Opportunity,
} from "./schemas.js";

export interface AggregateInput {
  opportunity: Opportunity;
  modelId: string;
  modelLabel: string;
  provider: string;
  mode: "workflows" | "simulated";
  startedAt: number;
  settled: PromiseSettledResult<DimensionResult>[];
  keys: {
    openai?: string;
    anthropic?: string;
    xai?: string;
  };
}

function statusFromScore(score: number): Dashboard["status"] {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

const RISK_THEMES: Array<[string, RegExp]> = [
  ["budget", /\bbudget\b|\bfunding\b|\bpricing\b|\bprice\b/i],
  ["mutual-plan", /mutual action plan|\bmap\b|dated milestones?/i],
  ["executive-alignment", /executive|exec sponsor|economic buyer/i],
  ["security", /security|questionnaire|compliance/i],
  ["pilot", /\bpilot\b|validation outcome|success criteria/i],
  ["momentum", /last touch|activity level|silence|cadence|stalled|rescheduled/i],
  ["single-thread", /single[- ]thread|single champion|stakeholder coverage/i],
  ["competition", /competitor|competitive/i],
];

export function riskThemeKey(risk: { signal: string; description: string }): string {
  const text = `${risk.signal} ${risk.description}`;
  const named = RISK_THEMES.find(([, pattern]) => pattern.test(text));
  if (named) return named[0];
  return risk.signal
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5)
    .join("-");
}

export function selectTopRisks(risks: Dashboard["risks"]): Dashboard["risks"] {
  const seen = new Set<string>();
  const order = { Critical: 0, High: 1, Medium: 2 } as const;
  return [...risks]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .filter((r) => {
      const key = riskThemeKey(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function workflowOnlyRisks(
  workflowRisks: Dashboard["risks"],
  baselineRisks: Array<{ signal: string; description: string }>
): Dashboard["risks"] {
  const baselineThemes = new Set(baselineRisks.map(riskThemeKey));
  return workflowRisks.filter((risk) => !baselineThemes.has(riskThemeKey(risk)));
}

/** Fan-in dimension outputs into the final dashboard JSON. */
export async function aggregateResults(input: AggregateInput): Promise<Dashboard> {
  const successes: DimensionResult[] = [];
  const failures: DimensionName[] = [];

  for (const item of input.settled) {
    if (item.status === "fulfilled") successes.push(item.value);
    else {
      const dim = (item.reason as { dimension?: DimensionName })?.dimension;
      failures.push(dim ?? "Momentum");
    }
  }

  if (failures.length >= 3) {
    throw new Error(
      `Too many dimension failures (${failures.length}). Try again or pick another model.`
    );
  }

  const partial = failures.length > 0;
  const scores = successes.map((s) => s.score);
  const overall = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const dimensionSummaries = successes.map((s) => ({
    name: s.dimension,
    score: s.score,
    findings: s.findings,
    failed: false,
  }));

  for (const failed of failures) {
    dimensionSummaries.push({
      name: failed,
      score: 0,
      findings: "Analysis failed for this dimension.",
      failed: true,
    });
  }

  const mergedRisks = selectTopRisks(
    successes.flatMap((s) =>
      s.risks.map((r) => ({
        severity: r.severity,
        signal: r.signal,
        description: r.description,
        dimension: s.dimension,
      }))
    )
  );

  const synthesis = await callModel(
    {
      modelId: input.modelId,
      system:
        "You are a decisive senior revenue operations analyst. Ground every claim in the supplied evidence. Remove repetition, avoid consultant language, and write for a sales leader who needs to act now.",
      user: `Company: ${input.opportunity.company}
Stage: ${input.opportunity.stage}
ARR: $${input.opportunity.arr}

Dimension analyses:
${JSON.stringify(successes, null, 2)}

Write a two-sentence verdict under 60 words. Sentence one states the deal truth. Sentence two states what must happen next.

Return exactly three prioritized actions. Each action must start with a concrete verb, name the evidence-backed gap it resolves, and avoid repeating another action.

Also return three concise context cards (deal_context, decision_path, validation_scope).`,
      schema: SYNTHESIS_JSON_SCHEMA,
      schemaName: "synthesis_result",
      maxTokens: 800,
      keys: input.keys,
    },
    (raw) => synthesisResultSchema.parse(JSON.parse(raw))
  );

  return {
    overall_score: overall,
    status: statusFromScore(overall),
    summary: synthesis.summary,
    dimensions: dimensionSummaries,
    risks: mergedRisks,
    recommendations: synthesis.recommendations,
    context: synthesis.context,
    reasoning: successes.map((s) => ({
      dimension: s.dimension,
      steps: s.reasoning_steps,
    })),
    meta: {
      modelId: input.modelId,
      modelLabel: input.modelLabel,
      provider: input.provider,
      mode: input.mode,
      durationMs: Date.now() - input.startedAt,
      partial,
    },
  };
}
