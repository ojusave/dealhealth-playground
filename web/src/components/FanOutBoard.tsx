import { useEffect, useMemo, useState } from "react";
import type { RunSnapshot, TaskNode } from "../lib/api";
import { Badge } from "./Chrome";

function elapsed(start?: string): string {
  if (!start) return "0.0s";
  return `${((Date.now() - Date.parse(start)) / 1000).toFixed(1)}s`;
}

const STATUS: Record<
  string,
  { label: string; tone: string; icon: string }
> = {
  queued: { label: "Queued", tone: "text-faint", icon: "○" },
  running: { label: "Running", tone: "text-accent", icon: "◉" },
  completed: { label: "Done", tone: "text-healthy", icon: "✓" },
  failed: { label: "Failed", tone: "text-critical", icon: "✕" },
};

function runStatusTone(status: string): string {
  if (status === "running") return "live";
  if (status === "failed") return "critical";
  if (status === "completed") return "new";
  return "neutral";
}

function NodeCard({
  node,
  selected,
  onSelect,
  live,
  index,
}: {
  node: TaskNode;
  selected: boolean;
  onSelect: () => void;
  live: boolean;
  index: number;
}) {
  const meta = STATUS[node.status] ?? STATUS.queued;
  const border =
    node.status === "running"
      ? "border-accent/60 pulse-live"
      : node.status === "failed"
        ? "border-critical/60 bg-critical/5"
        : node.status === "completed"
          ? "border-healthy/40 bg-healthy/5"
          : "border-border bg-surface/40";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`animate-fade-up w-full rounded-xl border p-3 text-left transition-all ${border} ${
        selected ? "ring-2 ring-accent/50" : "hover:border-border-bright"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${meta.tone}`}>{meta.icon}</span>
          <span className="text-sm font-medium text-ink">{node.dimension}</span>
        </div>
        {node.attempt > 1 && <Badge tone="retry">retry {node.attempt}</Badge>}
      </div>
      <p className={`mt-1.5 text-xs ${meta.tone}`}>{meta.label}</p>
      {live && node.status === "running" && (
        <p className="telemetry mt-1 text-accent">{elapsed(node.startedAt)} elapsed</p>
      )}
      {node.score != null && (
        <p className="mt-2 font-mono text-sm font-semibold text-ink">Score {node.score}</p>
      )}
      {node.message && <p className="mt-1.5 text-xs text-critical">{node.message}</p>}
    </button>
  );
}

export function FanOutBoardIdle({ company, modelLabel }: { company: string; modelLabel: string }) {
  const dims = [
    "Momentum",
    "Qualification",
    "Technical & Security",
    "Commercial Readiness",
    "Execution Alignment",
  ];

  return (
    <section className="panel h-full min-h-[420px]">
      <div className="panel-header">
        <div>
          <p className="font-display text-sm font-semibold">Workflow pipeline</p>
          <p className="mt-0.5 text-xs text-muted">Idle until you start an analysis</p>
        </div>
        <Badge tone="neutral">Standby</Badge>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-4">
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{modelLabel}</span> will analyze{" "}
            <span className="font-medium text-ink">{company}</span> across five dimensions. Each
            dimension runs as its own Render Workflows task on a dedicated instance.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1.4fr_auto_1fr] lg:items-center">
          <PipelineStage title="Root task" subtitle="analyzeOpportunity" status="pending" />
          <Connector active={false} />
          <div className="space-y-2">
            {dims.map((d) => (
              <div
                key={d}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/30 px-3 py-2"
              >
                <span className="text-xs text-muted">{d}</span>
                <span className="font-mono text-[10px] text-faint">queued</span>
              </div>
            ))}
          </div>
          <Connector active={false} />
          <PipelineStage title="Merge & score" subtitle="synthesis call" status="pending" />
        </div>
      </div>
    </section>
  );
}

function PipelineStage({
  title,
  subtitle,
  status,
  failed,
}: {
  title: string;
  subtitle: string;
  status: string;
  failed?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        failed
          ? "border-critical/50 bg-critical/10"
          : status === "running"
            ? "border-accent/50 bg-accent/10 pulse-live"
            : status === "completed"
              ? "border-healthy/40 bg-healthy/5"
              : "border-border bg-surface/50"
      }`}
    >
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="telemetry mt-1">{subtitle}</p>
      <p
        className={`mt-3 text-xs font-medium uppercase tracking-wider ${
          failed ? "text-critical" : status === "running" ? "text-accent" : "text-faint"
        }`}
      >
        {failed ? "failed" : status}
      </p>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div
      className={`hidden h-px flex-1 lg:block ${active ? "pipeline-line bg-accent/40" : "bg-border"}`}
      aria-hidden
    />
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
  const done = snapshot.status === "completed" || snapshot.status === "failed";
  const failed = snapshot.status === "failed";
  const parallelCount = snapshot.tasks.filter((t) => t.status === "running" || t.status === "completed").length;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [done, tick]);

  const mergeStatus = snapshot.result
    ? "completed"
    : running
      ? "running"
      : failed
        ? "failed"
        : "pending";

  return (
    <section className="panel animate-fade-up">
      <div className="panel-header">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={snapshot.mode === "workflows" ? "live" : "neutral"}>
            {snapshot.mode === "workflows" ? "Live on Render Workflows" : "Simulated"}
          </Badge>
          <span className="text-sm text-muted">
            {parallelCount} of 5 dimension tasks active
            {running > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-accent">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
                {running} running now
              </span>
            )}
          </span>
        </div>
        <Badge tone={runStatusTone(snapshot.status)}>{snapshot.status}</Badge>
      </div>

      {failed && snapshot.error && (
        <div className="mx-5 mt-4 rounded-xl border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
          <p className="font-medium">Run failed</p>
          <p className="mt-1 text-critical/90">{snapshot.error}</p>
        </div>
      )}

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_1.4fr_auto_1fr] lg:items-stretch">
        <PipelineStage
          title={`Analyze ${company}`}
          subtitle="analyzeOpportunity"
          status={snapshot.status === "queued" ? "queued" : snapshot.status}
          failed={failed}
        />
        <Connector active={parallelCount > 0} />

        <div className="space-y-2">
          {snapshot.tasks.map((t, i) => (
            <NodeCard
              key={t.dimension}
              node={t}
              index={i}
              selected={selected?.dimension === t.dimension}
              onSelect={() => onSelect(t)}
              live={!done}
            />
          ))}
        </div>

        <Connector active={!!snapshot.result} />

        <PipelineStage
          title="Merge & score"
          subtitle="aggregate + synthesis"
          status={mergeStatus}
          failed={failed && !snapshot.result}
        />
      </div>

      <p className="border-t border-border px-5 py-3 text-xs text-faint">
        Each dimension card maps to an isolated workflow task run. Close the tab: the run still
        finishes on Render.
      </p>
    </section>
  );
}

export function TaskInspector({ node }: { node: TaskNode | null }) {
  if (!node) {
    return (
      <aside className="panel p-5 text-sm text-muted">
        <p className="font-display font-semibold text-ink">Task inspector</p>
        <p className="mt-2 text-xs leading-relaxed">
          Click a dimension card to see timestamps, run IDs, scores, and reasoning steps.
        </p>
      </aside>
    );
  }

  const meta = STATUS[node.status] ?? STATUS.queued;

  return (
    <aside className="panel animate-fade-up p-5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-ink">{node.dimension}</h3>
          <p className={`mt-1 text-xs font-medium ${meta.tone}`}>{meta.label}</p>
        </div>
        {node.attempt > 1 && <Badge tone="retry">Attempt {node.attempt}</Badge>}
      </div>

      <dl className="mt-4 grid gap-2 rounded-xl border border-border bg-surface/60 p-3 font-mono text-xs text-muted">
        {node.queuedAt && <div>queued {new Date(node.queuedAt).toLocaleTimeString()}</div>}
        {node.startedAt && <div>started {new Date(node.startedAt).toLocaleTimeString()}</div>}
        {node.finishedAt && <div>finished {new Date(node.finishedAt).toLocaleTimeString()}</div>}
        {node.durationMs != null && <div>duration {(node.durationMs / 1000).toFixed(1)}s</div>}
        {node.taskRunId && <div className="truncate">run {node.taskRunId}</div>}
        {node.score != null && <div className="text-ink">score {node.score}</div>}
      </dl>

      {node.findings && (
        <p className="mt-4 leading-relaxed text-muted">{node.findings}</p>
      )}
      {node.reasoning && node.reasoning.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-muted">
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
    <div className="panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-sm font-semibold">Run timeline</p>
          <p className="telemetry mt-1">
            {(computeMs / 1000).toFixed(1)}s compute · {(wallMs / 1000).toFixed(1)}s wall clock
          </p>
        </div>
        <p className="text-xs text-muted">Parallel fan-out compresses wall time</p>
      </div>

      <div className="relative mt-4 h-20 min-w-[320px] overflow-hidden rounded-xl border border-border bg-surface">
        {bars.map((b, i) => (
          <div
            key={b.task.dimension}
            title={`${b.task.dimension} (${((b.task.durationMs ?? 0) / 1000).toFixed(1)}s)`}
            className="absolute top-3 h-14 rounded-md bg-gradient-to-r from-accent/80 to-accent-glow/90 shadow-glow transition-transform hover:scale-y-110"
            style={{ left: `${b.left}%`, width: `${b.width}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {bars.map((b) => (
          <span key={b.task.dimension} className="text-[10px] text-faint">
            {b.task.dimension}
          </span>
        ))}
      </div>
    </div>
  );
}
