import { useEffect, useMemo, useState } from "react";
import type { RunSnapshot, TaskNode } from "../lib/api";

const DIM_SHORT: Record<string, string> = {
  Momentum: "Momentum",
  Qualification: "Qualify",
  "Technical & Security": "Security",
  "Commercial Readiness": "Commercial",
  "Execution Alignment": "Execution",
};

function dotClass(status: string): string {
  if (status === "running") return "bg-accent animate-pulse";
  if (status === "completed") return "bg-healthy";
  if (status === "failed") return "bg-critical";
  return "bg-border";
}

function DimChip({
  node,
  label,
  selected,
  onSelect,
}: {
  node?: TaskNode;
  label: string;
  selected: boolean;
  onSelect?: () => void;
}) {
  const status = node?.status ?? "queued";
  const short = DIM_SHORT[node?.dimension ?? label] ?? label;

  const inner = (
    <>
      <span className={`status-dot ${dotClass(status)}`} />
      <span className="truncate">{short}</span>
      {node?.score != null && (
        <span className="font-mono text-label-13 text-muted">{node.score}</span>
      )}
    </>
  );

  if (!onSelect) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border px-2.5 py-2 text-label-13 text-faint">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-left text-label-13 transition-colors ${
        selected ? "border-ink/40 bg-surface text-ink" : "border-border text-muted hover:text-ink"
      }`}
    >
      {inner}
    </button>
  );
}

const IDLE_DIMS = [
  "Momentum",
  "Qualification",
  "Technical & Security",
  "Commercial Readiness",
  "Execution Alignment",
];

export function FanOutBoardIdle() {
  return (
    <section className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        {IDLE_DIMS.map((d) => (
          <DimChip key={d} label={d} selected={false} />
        ))}
        <span className="px-1 text-faint">→</span>
        <div className="rounded-md border border-border px-2.5 py-2 text-label-13 text-faint">Merge</div>
      </div>
    </section>
  );
}

export function FanOutBoard({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: RunSnapshot;
  company?: string;
  selected: TaskNode | null;
  onSelect: (t: TaskNode) => void;
}) {
  const [, setTick] = useState(0);
  const done = snapshot.status === "completed" || snapshot.status === "failed";

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [done]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-label-13">
        <span className="font-mono text-muted">
          {snapshot.mode === "workflows" ? "workflows" : "local"} · {snapshot.status}
        </span>
        {snapshot.status === "running" && (
          <span className="text-accent">Running…</span>
        )}
      </div>

      {snapshot.status === "failed" && snapshot.error && (
        <p className="text-copy-14 text-critical">{snapshot.error}</p>
      )}

      <div className="rounded-md border border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          {snapshot.tasks.map((t) => (
            <DimChip
              key={t.dimension}
              node={t}
              label={t.dimension}
              selected={selected?.dimension === t.dimension}
              onSelect={() => onSelect(t)}
            />
          ))}
          <span className="px-1 text-faint">→</span>
          <div
            className={`rounded-md border px-2.5 py-2 text-label-13 ${
              snapshot.result ? "border-healthy/40 text-healthy" : "border-border text-faint"
            }`}
          >
            Merge
          </div>
        </div>
      </div>
    </section>
  );
}

export function TaskInspector({ node }: { node: TaskNode | null }) {
  if (!node) return null;

  return (
    <aside className="rounded-md border border-border p-4 text-label-13">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{node.dimension}</span>
        <span className="font-mono text-muted">{node.status}</span>
      </div>
      <dl className="mt-3 space-y-1 font-mono text-muted">
        {node.durationMs != null && <div>{(node.durationMs / 1000).toFixed(1)}s</div>}
        {node.taskRunId && <div className="truncate">{node.taskRunId}</div>}
        {node.score != null && <div className="text-ink">{node.score}</div>}
      </dl>
      {node.findings && <p className="mt-3 text-copy-14 text-muted">{node.findings}</p>}
      {node.reasoning && node.reasoning.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-label-13 text-muted">
          {node.reasoning.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </aside>
  );
}

export function RunTimeline({ snapshot }: { snapshot: RunSnapshot }) {
  const { wallMs, computeMs, bars } = useMemo(() => {
    const starts = snapshot.tasks.map((t) => t.startedAt).filter(Boolean) as string[];
    const ends = snapshot.tasks.map((t) => t.finishedAt).filter(Boolean) as string[];
    if (!starts.length) return { wallMs: 0, computeMs: 0, bars: [] as Array<{ task: TaskNode; left: number; width: number }> };

    const t0 = Math.min(...starts.map(Date.parse));
    const t1 = Math.max(...ends.map(Date.parse), Date.now());
    const wall = Math.max(t1 - t0, 1);
    const compute = snapshot.tasks.reduce((s, t) => s + (t.durationMs ?? 0), 0);

    const bars = snapshot.tasks
      .filter((t) => t.startedAt && t.finishedAt)
      .map((t) => ({
        task: t,
        left: ((Date.parse(t.startedAt!) - t0) / wall) * 100,
        width: Math.max(((t.durationMs ?? 0) / wall) * 100, 2),
      }));

    return { wallMs: wall, computeMs: compute, bars };
  }, [snapshot]);

  if (!bars.length) return null;

  return (
    <div className="rounded-md border border-border p-4">
      <p className="font-mono text-label-13 text-muted">
        {(computeMs / 1000).toFixed(1)}s compute / {(wallMs / 1000).toFixed(1)}s wall
      </p>
      <div className="relative mt-3 h-8 overflow-hidden rounded bg-surface">
        {bars.map((b) => (
          <div
            key={b.task.dimension}
            title={b.task.dimension}
            className="absolute top-1 h-6 rounded-sm bg-ink/70"
            style={{ left: `${b.left}%`, width: `${b.width}%` }}
          />
        ))}
      </div>
    </div>
  );
}
