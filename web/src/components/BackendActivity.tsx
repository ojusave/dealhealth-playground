import { Badge, Group, ScrollArea, Stack, Text, Timeline } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    "root:running": "Root started",
    "dimension:queued": "Queued",
    "dimension:running": "Started",
    "dimension:completed": "Completed",
    "dimension:failed": "Failed",
    "aggregate:completed": "Merged",
    "run:failed": "Failed",
  };
  return labels[type] ?? type;
}

function activityColor(type: string): string {
  if (type.endsWith("completed")) return "green";
  if (type.endsWith("failed")) return "red";
  if (type.endsWith("running")) return "indigo";
  return "gray";
}

function timeLabel(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    minute: "2-digit",
    second: "2-digit",
  });
}

export function BackendActivity({
  snapshot,
  embedded = false,
}: {
  snapshot: RunSnapshot | null;
  embedded?: boolean;
}) {
  const events = snapshot?.activity ?? [];

  const body = (
    <Stack gap="md">
      {!embedded && (
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm">
            Event log
          </Text>
          {snapshot && (
            <Badge color={snapshot.status === "failed" ? "red" : "gray"} variant="light">
              {snapshot.status}
            </Badge>
          )}
        </Group>
      )}

      {!snapshot ? (
        <Text size="sm" c="dimmed">
          No run yet.
        </Text>
      ) : events.length === 0 ? (
        <Text size="sm" c="dimmed">
          Waiting for events…
        </Text>
      ) : (
        <ScrollArea.Autosize mah={360} type="auto">
          <Timeline active={events.length} bulletSize={18} lineWidth={2}>
            {[...events].reverse().map((event, index) => (
              <Timeline.Item
                key={`${event.timestamp}-${event.type}-${index}`}
                title={activityLabel(event.type)}
                color={activityColor(event.type)}
              >
                <Group gap="xs" mt={2}>
                  {event.dimension && (
                    <Text size="xs" fw={600}>
                      {event.dimension}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed">
                    {timeLabel(event.timestamp)}
                  </Text>
                </Group>
                {event.message && (
                  <Text size="xs" c="red" mt={4}>
                    {event.message}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </ScrollArea.Autosize>
      )}
    </Stack>
  );

  if (embedded) return body;
  return <div className="dh-panel" style={{ padding: "var(--mantine-spacing-md)" }}>{body}</div>;
}
