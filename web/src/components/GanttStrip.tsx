import { useMemo } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function barTone(score?: number, failed?: boolean): string {
  if (failed) return "critical";
  if (score == null) return "neutral";
  if (score >= 70) return "healthy";
  if (score >= 45) return "atrisk";
  return "critical";
}

const LEGEND = [
  { tone: "healthy", label: "Healthy (70+)" },
  { tone: "atrisk", label: "At risk (45–69)" },
  { tone: "critical", label: "Critical (<45)" },
] as const;

export function GanttStrip({ snapshot }: { snapshot: RunSnapshot }) {
  const { wallMs, computeMs, bars } = useMemo(() => {
    const starts = snapshot.tasks.map((t) => t.startedAt).filter(Boolean) as string[];
    const ends = snapshot.tasks.map((t) => t.finishedAt).filter(Boolean) as string[];
    if (!starts.length) return { wallMs: 0, computeMs: 0, bars: [] as Array<{ left: number; width: number; label: string; tone: string }> };

    const t0 = Math.min(...starts.map(Date.parse));
    const t1 = Math.max(...ends.map(Date.parse), Date.now());
    const wall = Math.max(t1 - t0, 1);
    const compute = snapshot.tasks.reduce((s, t) => s + (t.durationMs ?? 0), 0);

    const bars = snapshot.tasks
      .filter((t) => t.startedAt && t.finishedAt)
      .map((t) => ({
        label: t.dimension,
        left: ((Date.parse(t.startedAt!) - t0) / wall) * 100,
        width: Math.max(((t.durationMs ?? 0) / wall) * 100, 2),
        tone: barTone(t.score, t.status === "failed"),
      }));

    return { wallMs: wall, computeMs: compute, bars };
  }, [snapshot]);

  if (!bars.length) return null;

  return (
    <Paper className="dh-panel" p="md">
      <Stack gap="sm">
        <Text className="dh-section-title">Parallelism</Text>
        <Text size="sm" c="dimmed">
          {(computeMs / 1000).toFixed(1)}s of compute in {(wallMs / 1000).toFixed(1)}s of wall time
        </Text>
        <div className="gantt-track">
          {bars.map((b) => (
            <div
              key={b.label}
              className={`gantt-bar gantt-bar--${b.tone}`}
              style={{ left: `${b.left}%`, width: `${b.width}%` }}
              title={b.label}
            />
          ))}
        </div>
        <Group gap="md">
          {LEGEND.map((item) => (
            <Group key={item.tone} gap={6}>
              <span className={`gantt-legend gantt-legend--${item.tone}`} />
              <Text size="xs" c="dimmed">
                {item.label}
              </Text>
            </Group>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}
