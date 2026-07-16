import { Badge, Button, Group, RingProgress, SimpleGrid, Stack, Text } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function elapsed(snapshot: RunSnapshot | null): number {
  if (!snapshot) return 0;
  const end =
    snapshot.status === "completed" || snapshot.status === "failed"
      ? Date.parse(snapshot.lastEventAt ?? snapshot.queuedAt)
      : Date.now();
  return Math.max(0, end - Date.parse(snapshot.queuedAt));
}

type RunPhase = "idle" | "queued" | "running" | "completed" | "failed";

const PHASE_TITLE: Record<RunPhase, string> = {
  idle: "Not started",
  queued: "Queued",
  running: "Running",
  completed: "Run completed",
  failed: "Run failed",
};

export function RunSummary({
  snapshot,
  modelLabel,
  onViewAnalysis,
}: {
  snapshot: RunSnapshot | null;
  modelLabel: string;
  onViewAnalysis: () => void;
}) {
  const completed = snapshot?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const failed = snapshot?.tasks.filter((task) => task.status === "failed").length ?? 0;
  const settled = completed + failed;
  const compute = snapshot?.tasks.reduce((total, task) => total + (task.durationMs ?? 0), 0) ?? 0;
  const wall = elapsed(snapshot);
  const score = snapshot?.result?.overall_score;
  const phase: RunPhase = snapshot?.status ?? "idle";
  const active = phase === "queued" || phase === "running";

  // Status ring: idle shows the empty track only; an active run pulses a full
  // indigo ring (CSS keys off data-dh-pulse); terminal states are solid + glyph.
  const statusSections =
    phase === "idle"
      ? []
      : [
          {
            value: 100,
            color: phase === "completed" ? "green" : phase === "failed" ? "red" : "indigo",
            ...(active ? { "data-dh-pulse": true } : null),
          },
        ];

  const statusGlyph =
    phase === "completed" ? (
      <Text ta="center" fz={12} fw={700} c="green" lh={1}>
        ✓
      </Text>
    ) : phase === "failed" ? (
      <Text ta="center" fz={12} fw={700} c="red" lh={1}>
        ✕
      </Text>
    ) : null;

  const dimensionSections = [
    ...(completed > 0 ? [{ value: completed * 20, color: "green" }] : []),
    ...(failed > 0 ? [{ value: failed * 20, color: "red" }] : []),
  ];

  // Determinate overall progress: (completed + failed) / 5, with a small floor
  // so an active run is visible before the first task settles. The strip is
  // always rendered (width 0 when idle) to keep the grid's child order stable
  // for the .run-summary-cell :nth-child / :last-child border rules.
  const stripWidth =
    phase === "idle" ? 0 : phase === "completed" ? 100 : Math.max(settled * 20, 4);
  const stripModifier = phase === "idle" ? "" : ` run-summary-progress--${active ? "running" : phase}`;

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing={0} className="run-summary">
      <div
        aria-hidden
        className={`run-summary-progress${stripModifier}`}
        style={{ width: `${stripWidth}%` }}
      />
      <Group gap="sm" className="run-summary-cell" wrap="nowrap">
        <RingProgress
          size={48}
          thickness={4}
          rootColor="var(--dh-track)"
          sections={statusSections}
          label={statusGlyph}
        />
        <Stack gap={1} style={{ minWidth: 0 }}>
          <Text size="sm" fw={600}>{PHASE_TITLE[phase]}</Text>
          <Text size="xs" c="dimmed">
            {snapshot ? `${(wall / 1000).toFixed(1)}s elapsed` : "Awaiting run"}
          </Text>
        </Stack>
      </Group>
      <Group gap="sm" className="run-summary-cell" wrap="nowrap">
        <RingProgress
          size={48}
          thickness={4}
          rootColor="var(--dh-track)"
          sections={dimensionSections}
          label={
            <Text ta="center" fz={10} fw={600}>
              {completed}/5
            </Text>
          }
        />
        <Stack gap={1} style={{ minWidth: 0 }}>
          <Text size="sm" fw={600}>{completed}/5 complete</Text>
          <Text size="xs" c="dimmed">{failed ? `${failed} failed` : "Dimensions"}</Text>
        </Stack>
      </Group>
      <Stack gap={2} className="run-summary-cell" justify="center">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Overall score</Text>
        <Group gap="xs">
          <Text size="xl" fw={700}>{score ?? "—"}</Text>
          {snapshot?.result && (
            <Badge variant="light" color={score != null && score >= 70 ? "green" : score != null && score >= 45 ? "yellow" : "red"}>
              {snapshot.result.status}
            </Badge>
          )}
        </Group>
        {snapshot?.status === "completed" && snapshot.result ? (
          <Button size="xs" variant="filled" mt={2} style={{ alignSelf: "flex-start" }} onClick={onViewAnalysis}>
            View analysis
          </Button>
        ) : null}
      </Stack>
      <Stack gap={2} className="run-summary-cell" justify="center">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Compute / wall</Text>
        <Text size="sm" fw={600}>
          {(compute / 1000).toFixed(1)}s / {(wall / 1000).toFixed(1)}s
        </Text>
        <Text size="xs" c="dimmed">Parallel execution</Text>
      </Stack>
      <Stack gap={2} className="run-summary-cell" justify="center">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Model</Text>
        <Text size="sm" fw={600} lineClamp={1}>{modelLabel}</Text>
        <Text size="xs" c="dimmed">
          {snapshot?.mode === "workflows"
            ? "Render Workflows"
            : snapshot?.mode === "simulated"
              ? "Local parallel run"
              : "Ready"}
        </Text>
      </Stack>
    </SimpleGrid>
  );
}
