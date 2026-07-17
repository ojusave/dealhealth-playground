import { riskThemeKey } from "@dealhealth/core";

type RiskText = { signal: string; description: string };

export function displayRiskSignal(signal: string): string {
  const normalized = signal.toLowerCase();
  if (/budget/.test(normalized) && /false|unconfirmed|no confirmed/.test(normalized)) {
    return "Budget unconfirmed";
  }
  if (/mutual.?action.?plan|\bmap\b/.test(normalized) && /false|missing|no /.test(normalized)) {
    return "Mutual action plan missing";
  }
  if (/exec.*sponsor/.test(normalized) && /false|not engaged|missing/.test(normalized)) {
    return "Executive sponsor not engaged";
  }
  if (/pilot/.test(normalized) && /in progress/.test(normalized)) {
    return "Pilot still in progress";
  }
  const days = signal.match(/(?:daysSinceLastTouch|days_since_last_touch)\s*:\s*(\d+)/i);
  if (days) return `${days[1]} days since last touch`;
  return signal
    .split(";")[0]
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueRiskThemes<T extends RiskText>(risks: T[], limit = 3): T[] {
  const seen = new Set<string>();
  return risks
    .filter((risk) => {
      const theme = riskThemeKey(risk);
      if (seen.has(theme)) return false;
      seen.add(theme);
      return true;
    })
    .slice(0, limit);
}
