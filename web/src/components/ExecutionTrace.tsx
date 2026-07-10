import { Group, Stack, Text } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function duration(task: RunSnapshot["tasks"][number]): number {
  if (task.durationMs != null) return task.durationMs;
  if (!task.startedAt) return 0;
  return Math.max(0, Date.now() - Date.parse(task.startedAt));
}

export function ExecutionTrace({ snapshot }: { snapshot: RunSnapshot | null }) {
  const tasks = snapshot?.tasks ?? [];
  const max = Math.max(...tasks.map(duration), 1);

  return (
    <Stack gap="xs" className="execution-trace">
      <Group justify="space-between">
        <Text className="workspace-kicker">Execution trace</Text>
        {snapshot && (
          <Text size="xs" c="dimmed">
            Wall time
          </Text>
        )}
      </Group>
      {!snapshot ? (
        <Text size="sm" c="dimmed">Timing appears after the run starts.</Text>
      ) : (
        tasks.map((task) => {
          const ms = duration(task);
          const width = task.status === "queued" ? 2 : Math.max(4, (ms / max) * 100);
          return (
            <div className="trace-row" key={task.dimension}>
              <Text size="xs" className="trace-label" lineClamp={1}>
                {task.dimension}
              </Text>
              <div className="trace-track">
                <div
                  className={`trace-bar trace-bar--${task.status}`}
                  style={{ width: `${width}%` }}
                >
                  {ms > 0 && <span>{(ms / 1000).toFixed(1)}s</span>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </Stack>
  );
}
