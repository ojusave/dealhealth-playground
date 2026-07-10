import { Badge, Group, RingProgress, SimpleGrid, Stack, Text } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function elapsed(snapshot: RunSnapshot | null): number {
  if (!snapshot) return 0;
  const end =
    snapshot.status === "completed" || snapshot.status === "failed"
      ? Date.parse(snapshot.lastEventAt ?? snapshot.queuedAt)
      : Date.now();
  return Math.max(0, end - Date.parse(snapshot.queuedAt));
}

export function RunSummary({
  snapshot,
  modelLabel,
}: {
  snapshot: RunSnapshot | null;
  modelLabel: string;
}) {
  const completed = snapshot?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const failed = snapshot?.tasks.filter((task) => task.status === "failed").length ?? 0;
  const compute = snapshot?.tasks.reduce((total, task) => total + (task.durationMs ?? 0), 0) ?? 0;
  const wall = elapsed(snapshot);
  const score = snapshot?.result?.overall_score;
  const status = snapshot?.status ?? "idle";
  const statusColor =
    status === "completed" ? "green" : status === "failed" ? "red" : status === "running" ? "indigo" : "gray";

  return (
    <SimpleGrid cols={{ base: 2, sm: 5 }} spacing={0} className="run-summary">
      <Group gap="sm" className="run-summary-cell">
        <RingProgress
          size={36}
          thickness={4}
          sections={[{ value: snapshot ? 100 : 0, color: statusColor }]}
          label={<Text ta="center" size="xs">{status === "completed" ? "✓" : "·"}</Text>}
        />
        <Stack gap={1}>
          <Text size="sm" fw={600}>Run {status}</Text>
          <Text size="xs" c="dimmed">
            {snapshot ? `${(elapsed(snapshot) / 1000).toFixed(1)}s elapsed` : "Not started"}
          </Text>
        </Stack>
      </Group>
      <Group gap="sm" className="run-summary-cell">
        <RingProgress
          size={36}
          thickness={4}
          sections={[{ value: completed * 20, color: failed ? "red" : "green" }]}
          label={<Text ta="center" size="xs">{completed}/5</Text>}
        />
        <Stack gap={1}>
          <Text size="sm" fw={600}>{completed} / 5 complete</Text>
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
        <Text size="xs" c="dimmed">{snapshot?.mode ?? "Ready"}</Text>
      </Stack>
    </SimpleGrid>
  );
}
