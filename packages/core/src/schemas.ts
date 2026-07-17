import { z } from "zod";

export const STAGES = [
  "Discovery",
  "Evaluation",
  "Proposal",
  "Negotiation",
  "Closing",
] as const;

export const PILOT_STATUSES = [
  "not started",
  "in progress",
  "successful",
  "failed",
] as const;

export const SECURITY_STATUSES = [
  "not started",
  "in progress",
  "complete",
] as const;

export const opportunitySchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1).max(120),
  stage: z.enum(STAGES),
  arr: z.number().int().min(0).max(100_000_000),
  expectedCloseDate: z.string().min(1),
  activityLevel: z.number().int().min(0).max(10),
  daysSinceLastTouch: z.number().int().min(0).max(365),
  budgetConfirmed: z.boolean(),
  economicBuyerIdentified: z.boolean(),
  execSponsorEngaged: z.boolean(),
  pilotStatus: z.enum(PILOT_STATUSES),
  securityReview: z.enum(SECURITY_STATUSES),
  discoveryComplete: z.boolean(),
  mutualActionPlan: z.boolean(),
  competitorInDeal: z.boolean(),
  notes: z.string().max(500).default(""),
});

export type Opportunity = z.infer<typeof opportunitySchema>;

export const severitySchema = z.enum(["Critical", "High", "Medium"]);

export const dimensionResultSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(100),
  findings: z.string(),
  risks: z.array(
    z.object({
      severity: severitySchema,
      signal: z.string(),
      description: z.string(),
    })
  ).max(2),
  reasoning_steps: z.array(z.string()),
});

export type DimensionResult = z.infer<typeof dimensionResultSchema>;

export const dashboardSchema = z.object({
  overall_score: z.number().min(0).max(100),
  status: z.enum(["Healthy", "At Risk", "Critical"]),
  summary: z.string(),
  dimensions: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      findings: z.string(),
      failed: z.boolean(),
    })
  ),
  risks: z.array(
    z.object({
      severity: severitySchema,
      signal: z.string(),
      description: z.string(),
      dimension: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  context: z.object({
    deal_context: z.string(),
    decision_path: z.string(),
    validation_scope: z.string(),
  }),
  reasoning: z.array(
    z.object({
      dimension: z.string(),
      steps: z.array(z.string()),
    })
  ),
  meta: z.object({
    modelId: z.string(),
    modelLabel: z.string(),
    provider: z.string(),
    mode: z.enum(["workflows", "simulated"]),
    durationMs: z.number(),
    partial: z.boolean(),
  }),
});

export type Dashboard = z.infer<typeof dashboardSchema>;

export const baselineRiskSchema = z.object({
  severity: severitySchema,
  signal: z.string(),
  description: z.string(),
});

export const baselineContentSchema = z.object({
  summary: z.string(),
  risks: z.array(baselineRiskSchema).min(1).max(3),
  recommendations: z.array(z.string()).length(3),
});

export type BaselineContent = z.infer<typeof baselineContentSchema>;

export const baselineResultSchema = baselineContentSchema.extend({
  meta: z.object({
    modelId: z.string(),
    modelLabel: z.string(),
    provider: z.string(),
    durationMs: z.number(),
  }),
});

export type BaselineResult = z.infer<typeof baselineResultSchema>;

export const analyzeRequestSchema = z.object({
  opportunity: opportunitySchema,
  modelId: z.string().min(1),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const synthesisResultSchema = z.object({
  summary: z.string(),
  recommendations: z.array(z.string()).length(3),
  context: z.object({
    deal_context: z.string(),
    decision_path: z.string(),
    validation_scope: z.string(),
  }),
});

export type SynthesisResult = z.infer<typeof synthesisResultSchema>;

export const DIMENSION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    dimension: { type: "string" },
    score: { type: "number" },
    findings: { type: "string" },
    risks: {
      type: "array",
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["Critical", "High", "Medium"] },
          signal: { type: "string" },
          description: { type: "string" },
        },
        required: ["severity", "signal", "description"],
      },
    },
    reasoning_steps: { type: "array", items: { type: "string" } },
  },
  required: ["dimension", "score", "findings", "risks", "reasoning_steps"],
} as const;

export const SYNTHESIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
    context: {
      type: "object",
      additionalProperties: false,
      properties: {
        deal_context: { type: "string" },
        decision_path: { type: "string" },
        validation_scope: { type: "string" },
      },
      required: ["deal_context", "decision_path", "validation_scope"],
    },
  },
  required: ["summary", "recommendations", "context"],
} as const;

export const BASELINE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    risks: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["Critical", "High", "Medium"] },
          signal: { type: "string" },
          description: { type: "string" },
        },
        required: ["severity", "signal", "description"],
      },
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["summary", "risks", "recommendations"],
} as const;
