import { useEffect, useState } from "react";
import type { ModelsResponse } from "../lib/api";

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  xai: "xAI",
};

function groupLabel(name: string, source: string): string {
  const base = PROVIDER_LABEL[name] ?? name;
  if (source === "live") return base;
  if (source === "stale") return `${base} · stale`;
  return `${base} · cached`;
}

export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ModelsResponse | null;
  value: string;
  onChange: (id: string) => void;
}) {
  if (!models) {
    return <select className="field" disabled aria-label="Model"><option>Loading…</option></select>;
  }

  return (
    <select
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Model"
    >
      {Object.entries(models.providers).map(([name, group]) => (
        <optgroup key={name} label={groupLabel(name, group.source)}>
          {group.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function usePersistedModel(
  defaultId: string,
  available: string[]
): [string, (id: string) => void] {
  const [modelId, setModelId] = useState(() => {
    const saved = localStorage.getItem("dealhealth-model");
    return saved && available.includes(saved) ? saved : defaultId;
  });

  useEffect(() => {
    if (available.includes(modelId)) localStorage.setItem("dealhealth-model", modelId);
  }, [modelId, available]);

  useEffect(() => {
    if (!available.includes(modelId) && available.length) {
      setModelId(available.includes(defaultId) ? defaultId : available[0]);
    }
  }, [available, defaultId, modelId]);

  return [modelId, setModelId];
}
