export const DIMENSIONS = [
  "Momentum",
  "Qualification",
  "Technical & Security",
  "Commercial Readiness",
  "Execution Alignment",
] as const;

export type DimensionName = (typeof DIMENSIONS)[number];

export const DIMENSION_RUBRICS: Record<DimensionName, string> = {
  Momentum: `Score activity level (0-10), days since last touch, meeting cadence, and stakeholder responsiveness.
90-100: Weekly+ touch, <7 days silence, fast responses.
70-89: Regular cadence, <14 days silence.
40-69: Sparse activity, 14-30 days silence.
0-39: Long silence or stalled engagement.`,

  Qualification: `Score budget confirmation, economic buyer identification, need clarity, and decision criteria.
90-100: Budget confirmed, EB identified, clear need and criteria.
70-89: Most qualification criteria met.
40-69: Gaps in budget or EB.
0-39: Unqualified or ambiguous need.`,

  "Technical & Security": `Score pilot/validation status, security review progress, and integration risk.
90-100: Successful pilot, security complete, low integration risk.
70-89: Pilot progressing well, security in progress.
40-69: Pilot incomplete or security gaps.
0-39: Failed pilot or blocked security.`,

  "Commercial Readiness": `Score pricing socialization, legal/procurement engagement, and close date realism vs stage.
90-100: Pricing agreed, legal engaged, realistic timeline.
70-89: Most commercial steps underway.
40-69: Pricing or procurement gaps.
0-39: No commercial path or unrealistic close date.`,

  "Execution Alignment": `Score mutual action plan, executive sponsor, defined next steps, and single-threading risk.
90-100: MAP in place, exec sponsor, clear next steps, multi-threaded.
70-89: Good alignment with minor gaps.
40-69: Missing MAP or exec sponsor.
0-39: Single-threaded or no defined path forward.`,
};
