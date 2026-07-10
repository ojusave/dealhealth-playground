import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dashboard } from "../lib/api";
import { Badge } from "./Chrome";

function scoreColor(status: string): string {
  if (status === "Healthy") return "#34D399";
  if (status === "At Risk") return "#FBBF24";
  return "#F87171";
}

function barColor(score: number): string {
  if (score >= 70) return "#34D399";
  if (score >= 45) return "#FBBF24";
  return "#F87171";
}

export function DashboardView({
  data,
  onReanalyze,
  onCompare,
}: {
  data: Dashboard;
  onReanalyze: () => void;
  onCompare: () => void;
}) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const chartData = data.dimensions.map((d, i) => ({ name: d.name, score: d.score, idx: i }));

  return (
    <section className="space-y-5 animate-fade-up">
      {data.meta.partial && (
        <div className="rounded-xl border border-atrisk/40 bg-atrisk/10 px-4 py-3 text-sm text-atrisk">
          Partial dashboard: one or more dimensions failed. Scores exclude failed dimensions.
        </div>
      )}

      <div className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div
          className="score-enter font-mono text-7xl font-bold tabular-nums"
          style={{ color: scoreColor(data.status) }}
        >
          {data.overall_score}
        </div>
        <div className="flex-1">
          <p className="font-display text-2xl font-semibold">{data.status}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{data.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="live">{data.meta.modelLabel}</Badge>
            <span className="telemetry">{(data.meta.durationMs / 1000).toFixed(1)}s end-to-end</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="font-display text-sm font-semibold">Health breakdown</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#5C6478" tick={{ fill: "#8B93A7", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  stroke="#5C6478"
                  tick={{ fill: "#8B93A7", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#161B26",
                    border: "1px solid #252D3D",
                    borderRadius: 12,
                    color: "#F4F6FA",
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} className="bar-enter">
                  {chartData.map((entry) => (
                    <Cell key={entry.idx} fill={barColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-display text-sm font-semibold">Recommendations</h3>
          <ul className="mt-4 space-y-3">
            {data.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-muted"
              >
                <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel overflow-x-auto p-5">
        <h3 className="font-display text-sm font-semibold">Risk register</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-faint">
              <th className="py-2 pr-4">Severity</th>
              <th className="py-2 pr-4">Signal</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.risks.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-3 pr-4">
                  <Badge tone={r.severity.toLowerCase()}>{r.severity}</Badge>
                </td>
                <td className="py-3 pr-4 font-medium text-ink">{r.signal}</td>
                <td className="py-3 pr-4 text-muted">{r.description}</td>
                <td className="py-3 telemetry">{r.dimension}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Deal Context", data.context.deal_context],
          ["Decision Path", data.context.decision_path],
          ["Validation Scope", data.context.validation_scope],
        ].map(([title, body]) => (
          <div key={title} className="panel p-4">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted">
              {title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-ink/90">{body}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setReasoningOpen(!reasoningOpen)}
        className="text-sm text-accent hover:underline"
      >
        {reasoningOpen ? "Hide" : "Show"} how {data.meta.modelLabel} reasoned
      </button>
      {reasoningOpen && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.reasoning.map((r) => (
            <div key={r.dimension} className="panel p-4">
              <p className="font-medium text-sm text-ink">{r.dimension}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted">
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReanalyze} className="btn-ghost">
          Edit inputs & re-analyze
        </button>
        <button type="button" onClick={onCompare} className="btn-primary">
          Compare with another model
        </button>
      </div>
    </section>
  );
}
