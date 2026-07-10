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

function dedupeRisks(
  risks: Dashboard["risks"]
): Dashboard["risks"] {
  const seen = new Set<string>();
  const order = { Critical: 0, High: 1, Medium: 2 } as const;
  return risks
    .filter((r) => {
      const key = `${r.signal.toLowerCase()}|${r.dimension}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => order[a.severity] - order[b.severity]);
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

  const mergedRisks = dedupeRisks(
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
        "You are a senior revenue operations analyst writing an executive deal health summary. Ground every claim in the dimension outputs provided.",
      user: `Company: ${input.opportunity.company}
Stage: ${input.opportunity.stage}
ARR: $${input.opportunity.arr}

Dimension analyses:
${JSON.stringify(successes, null, 2)}

Write a 3-4 sentence summary contrasting narrative strength vs execution gaps, plus 3-5 concrete next actions and three context cards (deal_context, decision_path, validation_scope).`,
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
