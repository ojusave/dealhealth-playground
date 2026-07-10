import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dashboard } from "../lib/api";
import { Badge } from "./Chrome";

function scoreColor(status: string): string {
  if (status === "Healthy") return "#50e3c2";
  if (status === "At Risk") return "#f5a623";
  return "#ee0000";
}

function barColor(score: number): string {
  if (score >= 70) return "#50e3c2";
  if (score >= 45) return "#f5a623";
  return "#ee0000";
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
    <section className="space-y-6 border-t border-border pt-8">
      {data.meta.partial && (
        <p className="text-label-13 text-atrisk">Partial result. Some dimensions failed.</p>
      )}

      <div className="flex items-baseline gap-6">
        <span
          className="font-mono text-5xl font-semibold tabular-nums tracking-tight"
          style={{ color: scoreColor(data.status) }}
        >
          {data.overall_score}
        </span>
        <div>
          <p className="text-lg font-medium">{data.status}</p>
          <p className="mt-1 text-label-13 text-muted">
            {data.meta.modelLabel} · {(data.meta.durationMs / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      <p className="max-w-2xl text-copy-14 text-muted">{data.summary}</p>

      <div className="h-48 rounded-md border border-border p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#888", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid #333",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.idx} fill={barColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.risks.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-label-13">
            <tbody>
              {data.risks.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Badge tone={r.severity.toLowerCase()}>{r.severity}</Badge>
                  </td>
                  <td className="px-3 py-2 font-medium">{r.signal}</td>
                  <td className="px-3 py-2 text-muted">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="space-y-2 text-copy-14 text-muted">
        {data.recommendations.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setReasoningOpen(!reasoningOpen)}
        className="text-label-13 text-muted hover:text-ink"
      >
        {reasoningOpen ? "Hide reasoning" : "Show reasoning"}
      </button>
      {reasoningOpen && (
        <div className="space-y-2">
          {data.reasoning.map((r) => (
            <div key={r.dimension} className="rounded-md border border-border p-3 text-label-13">
              <p className="font-medium">{r.dimension}</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-muted">
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onReanalyze} className="btn-secondary">
          Re-analyze
        </button>
        <button type="button" onClick={onCompare} className="btn-primary">
          Compare models
        </button>
      </div>
    </section>
  );
}
