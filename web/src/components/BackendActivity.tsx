import { Badge, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { Timeline } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    "root:running": "Root workflow started",
    "dimension:queued": "Dimension queued",
    "dimension:running": "Dimension started",
    "dimension:completed": "Dimension completed",
    "dimension:failed": "Dimension failed",
    "aggregate:completed": "Dashboard aggregated",
    "run:failed": "Workflow failed",
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

export function BackendActivity({ snapshot }: { snapshot: RunSnapshot | null }) {
  const events = snapshot?.activity ?? [];

  return (
    <Paper className="dh-panel" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Stack gap={2}>
            <Text className="dh-section-title">Backend activity</Text>
            <Text size="sm" c="dimmed">
              Live events received from the API callback
            </Text>
          </Stack>
          {snapshot && (
            <Badge color={snapshot.status === "failed" ? "red" : "indigo"} variant="light">
              {snapshot.status}
            </Badge>
          )}
        </Group>

        {!snapshot ? (
          <Text size="sm" c="dimmed">
            Start an analysis to inspect the Render workflow event stream.
          </Text>
        ) : events.length === 0 ? (
          <Text size="sm" c="dimmed">
            Connected to the run. Waiting for the first backend event…
          </Text>
        ) : (
          <ScrollArea.Autosize mah={280} type="auto">
            <Timeline active={events.length} bulletSize={20} lineWidth={2}>
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
    </Paper>
  );
}
