import { useEffect, useState } from "react";
import type { ModelEntry, ModelsResponse } from "../lib/api";
import { Badge } from "./Chrome";

const PROVIDER_META: Record<string, { label: string; className: string; dot: string }> = {
  openai: { label: "OpenAI", className: "provider-openai", dot: "bg-openai" },
  anthropic: { label: "Anthropic", className: "provider-anthropic", dot: "bg-anthropic" },
  xai: { label: "xAI", className: "provider-xai", dot: "bg-xai" },
};

function tierLabel(tier: string): string {
  if (tier === "flagship") return "Flagship";
  if (tier === "balanced") return "Balanced";
  if (tier === "fast") return "Fast";
  return tier;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!models) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    );
  }

  const providers = Object.entries(models.providers);

  return (
    <div className="space-y-5">
      {providers.map(([name, group]) => {
        const meta = PROVIDER_META[name] ?? {
          label: name,
          className: "border-border bg-surface text-muted",
          dot: "bg-muted",
        };
        const visible = group.models.slice(0, expanded[name] ? undefined : 3);
        const hidden = group.models.length - visible.length;

        return (
          <div key={name} className="panel overflow-hidden">
            <div className="panel-header">
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <h3 className="font-display text-sm font-semibold">{meta.label}</h3>
                <Badge tone={group.source === "live" ? "live" : "fallback"}>{group.source}</Badge>
              </div>
              <span className="telemetry">{group.models.length} models</span>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {visible.map((m: ModelEntry) => {
                const selected = value === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange(m.id)}
                    className={`group rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? "border-accent bg-accent/10 shadow-glow"
                        : "border-border bg-surface/50 hover:border-border-bright hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug text-ink">{m.label}</span>
                      {m.isNew && <Badge tone="new">New</Badge>}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{tierLabel(m.tier)}</p>
                    {selected && (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-accent">
                        Selected
                      </p>
                    )}
                  </button>
                );
              })}

              {hidden > 0 && !expanded[name] && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [name]: true }))}
                  className="rounded-xl border border-dashed border-border bg-transparent p-3 text-sm text-muted transition-colors hover:border-accent/40 hover:text-ink"
                >
                  +{hidden} more {meta.label} models
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
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
