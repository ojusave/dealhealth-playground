import { Badge, Group, Paper, Tabs, Text } from "@mantine/core";
import type { RunSnapshot, TaskNode } from "../lib/api";
import { BackendActivity } from "./BackendActivity";
import { FlowBoard } from "./flow/FlowBoard";

export function RunPanel({
  snapshot,
  company,
  onSelectTask,
}: {
  snapshot: RunSnapshot | null;
  company: string;
  onSelectTask: (task: TaskNode | null, dimension: string) => void;
}) {
  const eventCount = snapshot?.activity?.length ?? 0;

  return (
    <Paper className="dh-panel canvas-panel" p="md">
      <Tabs defaultValue="graph">
        <Group justify="space-between" align="center" mb="md" wrap="nowrap">
          <Tabs.List>
            <Tabs.Tab value="graph">Graph</Tabs.Tab>
            <Tabs.Tab value="activity">
              Activity
              {eventCount > 0 && (
                <Badge size="xs" variant="light" color="gray" ml={6}>
                  {eventCount}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>
          {snapshot?.status && (
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {snapshot.status}
            </Text>
          )}
        </Group>

        <Tabs.Panel value="graph">
          <FlowBoard
            snapshot={snapshot}
            idle={!snapshot}
            company={company}
            onSelectTask={onSelectTask}
            embedded
          />
        </Tabs.Panel>

        <Tabs.Panel value="activity">
          <BackendActivity snapshot={snapshot} embedded />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
