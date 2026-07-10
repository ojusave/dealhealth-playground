export const DIMENSIONS = [
  "Momentum",
  "Qualification",
  "Technical & Security",
  "Commercial Readiness",
  "Execution Alignment",
] as const;

export const DIM_SHORT: Record<string, string> = {
  Momentum: "Momentum",
  Qualification: "Qualify",
  "Technical & Security": "Security",
  "Commercial Readiness": "Commercial",
  "Execution Alignment": "Execution",
};

export const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  xai: "xAI",
};

export const GITHUB_URL = "https://github.com/ojusave/dealhealth-playground";
export const DEPLOY_URL =
  "https://render.com/deploy?repo=https://github.com/ojusave/dealhealth-playground";
