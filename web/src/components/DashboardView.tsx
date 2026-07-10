import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dashboard } from "../lib/api";
import { Badge } from "./Chrome";

function scoreColor(status: string): string {
  if (status === "Healthy") return "#1F9D63";
  if (status === "At Risk") return "#E6A23C";
  return "#D64545";
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
    <section className="space-y-6">
      {data.meta.partial && (
        <p className="text-sm text-atrisk border border-atrisk/30 bg-atrisk/5 rounded-lg px-3 py-2">
          Partial dashboard: one or more dimensions failed. Scores exclude failed dimensions.
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div
          className="score-enter text-6xl font-semibold font-mono"
          style={{ color: scoreColor(data.status) }}
        >
          {data.overall_score}
        </div>
        <div>
          <p className="text-xl font-medium">{data.status}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge>{data.meta.modelLabel}</Badge>
            <span className="telemetry">{(data.meta.durationMs / 1000).toFixed(1)}s total</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-medium mb-3">Health breakdown</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#2F6FED" radius={4} className="bar-enter" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
        <h3 className="font-medium mb-3">Risk register</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="py-2 pr-4">Severity</th>
              <th className="py-2 pr-4">Signal</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.risks.map((r, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2 pr-4">
                  <Badge tone={r.severity.toLowerCase()}>{r.severity}</Badge>
                </td>
                <td className="py-2 pr-4 font-medium">{r.signal}</td>
                <td className="py-2 pr-4 text-muted">{r.description}</td>
                <td className="py-2 telemetry">{r.dimension}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-medium mb-2">Analysis</h3>
        <p className="text-muted leading-relaxed">{data.summary}</p>
        <ul className="mt-3 list-disc list-inside text-sm space-y-1">
          {data.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Deal Context", data.context.deal_context],
          ["Decision Path", data.context.decision_path],
          ["Validation Scope", data.context.validation_scope],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-sm text-muted mt-2 leading-relaxed">{body}</p>
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
        <div className="space-y-3">
          {data.reasoning.map((r) => (
            <div key={r.dimension} className="rounded-lg border border-border p-3 bg-card">
              <p className="font-medium text-sm">{r.dimension}</p>
              <ol className="list-decimal list-inside text-xs text-muted mt-2 space-y-1">
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReanalyze}
          className="px-4 py-2 rounded-lg border border-border hover:bg-surface text-sm"
        >
          Edit inputs & re-analyze
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
        >
          Run the same deal with another model
        </button>
      </div>
    </section>
  );
}
