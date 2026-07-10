import { useEffect, useState } from "react";
import type { ModelEntry, ModelsResponse } from "../lib/api";
import { Badge } from "./Chrome";

export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ModelsResponse | null;
  value: string;
  onChange: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!models) return <p className="text-sm text-muted">Loading models…</p>;

  const providers = Object.entries(models.providers);

  return (
    <div className="space-y-4">
      {providers.map(([name, group]) => {
        const visible = group.models.slice(0, expanded[name] ? undefined : 4);
        const hidden = group.models.length - visible.length;
        return (
          <div key={name}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium capitalize">{name}</h3>
              <Badge>{group.source}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {visible.map((m: ModelEntry) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange(m.id)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    value === m.id
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-border bg-card hover:border-accent/40"
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="ml-2 text-xs text-muted">{m.tier}</span>
                  {m.isNew && (
                    <span className="ml-2">
                      <Badge tone="new">New</Badge>
                    </span>
                  )}
                </button>
              ))}
              {hidden > 0 && !expanded[name] && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [name]: true }))}
                  className="px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted"
                >
                  +{hidden} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function usePersistedModel(defaultId: string, available: string[]): [string, (id: string) => void] {
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
