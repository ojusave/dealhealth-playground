import { useEffect, useMemo, useState } from "react";
import type { RunSnapshot, TaskNode } from "../lib/api";
import { Badge } from "./Chrome";

function elapsed(start?: string): string {
  if (!start) return "0.0s";
  return `${((Date.now() - Date.parse(start)) / 1000).toFixed(1)}s`;
}

function statusLabel(status: string): string {
  if (status === "queued") return "waiting for an instance";
  if (status === "running") return "running";
  if (status === "completed") return "done";
  if (status === "failed") return "failed";
  return status;
}

function NodeCard({
  node,
  selected,
  onSelect,
  live,
}: {
  node: TaskNode;
  selected: boolean;
  onSelect: () => void;
  live: boolean;
}) {
  const border =
    node.status === "running"
      ? "border-accent pulse-live"
      : node.status === "failed"
        ? "border-critical"
        : node.status === "completed"
          ? "border-healthy/50"
          : "border-border";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-3 rounded-lg border bg-card w-full transition-shadow ${border} ${selected ? "ring-2 ring-accent/40" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{node.dimension}</span>
        {node.attempt > 1 && <Badge tone="retry">retry</Badge>}
      </div>
      <p className="telemetry mt-1">{statusLabel(node.status)}</p>
      {live && node.status === "running" && (
        <p className="telemetry">{elapsed(node.startedAt)}</p>
      )}
      {node.taskRunId && <p className="telemetry truncate">{node.taskRunId}</p>}
      {node.score != null && (
        <p className="telemetry text-ink font-medium mt-1">score {node.score}</p>
      )}
      {node.message && <p className="text-xs text-critical mt-1">{node.message}</p>}
    </button>
  );
}

export function FanOutBoard({
  snapshot,
  company,
  selected,
  onSelect,
}: {
  snapshot: RunSnapshot;
  company: string;
  selected: TaskNode | null;
  onSelect: (t: TaskNode) => void;
}) {
  const [tick, setTick] = useState(0);
  const running = snapshot.tasks.filter((t) => t.status === "running").length;
  const done = snapshot.status === "completed";

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [done, tick]);

  const parallelCount = snapshot.tasks.filter((t) => t.status !== "queued").length;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge tone={snapshot.mode === "workflows" ? "live" : "neutral"}>
          {snapshot.mode === "workflows" ? "Live on Render Workflows" : "Simulated locally"}
        </Badge>
        <span className="text-sm text-muted">
          {parallelCount} task runs executing in parallel, each on its own instance
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr] items-stretch">
        <div className="p-4 rounded-lg border border-border bg-surface">
          <p className="text-sm font-medium">Analyze {company}</p>
          <p className="telemetry mt-2">{snapshot.status}</p>
        </div>

        <div className="space-y-2">
          {snapshot.tasks.map((t) => (
            <NodeCard
              key={t.dimension}
              node={t}
              selected={selected?.dimension === t.dimension}
              onSelect={() => onSelect(t)}
              live={!done}
            />
          ))}
        </div>

        <div className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-center">
          <p className="text-sm font-medium">Merge & score</p>
          <p className="telemetry mt-2">
            {snapshot.result ? "complete" : running ? "waiting on dimensions" : "pending"}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted mt-4">
        {snapshot.mode === "workflows"
          ? "Each card is an isolated task run on Render Workflows, executing on its own instance. Close the tab; the run finishes anyway."
          : "Simulated locally with the same code. In production, each card is an isolated Render Workflows task run."}
      </p>
    </section>
  );
}

export function TaskInspector({ node }: { node: TaskNode | null }) {
  if (!node) return null;
  return (
    <aside className="rounded-xl border border-border bg-card p-4 text-sm">
      <h3 className="font-medium">{node.dimension}</h3>
      <dl className="mt-3 space-y-1 telemetry">
        <div>status: {node.status}</div>
        {node.queuedAt && <div>queued: {new Date(node.queuedAt).toLocaleTimeString()}</div>}
        {node.startedAt && <div>started: {new Date(node.startedAt).toLocaleTimeString()}</div>}
        {node.finishedAt && <div>finished: {new Date(node.finishedAt).toLocaleTimeString()}</div>}
        {node.durationMs != null && <div>duration: {(node.durationMs / 1000).toFixed(1)}s</div>}
        <div>attempt: {node.attempt}</div>
        {node.taskRunId && <div>run id: {node.taskRunId}</div>}
      </dl>
      {node.findings && (
        <p className="mt-3 text-muted text-sm leading-relaxed">{node.findings}</p>
      )}
      {node.reasoning && node.reasoning.length > 0 && (
        <ol className="mt-2 list-decimal list-inside text-xs text-muted space-y-1">
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
    <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
      <p className="text-sm font-medium mb-2">Run timeline</p>
      <p className="telemetry mb-3">
        {(computeMs / 1000).toFixed(1)}s of compute in {(wallMs / 1000).toFixed(1)}s of wall time
      </p>
      <div className="relative h-16 min-w-[320px] bg-surface rounded-lg border border-border">
        {bars.map((b) => (
          <div
            key={b.task.dimension}
            title={b.task.dimension}
            className="absolute top-2 h-10 rounded bg-accent/70 hover:bg-accent transition-colors"
            style={{ left: `${b.left}%`, width: `${b.width}%` }}
          />
        ))}
      </div>
    </div>
  );
}
