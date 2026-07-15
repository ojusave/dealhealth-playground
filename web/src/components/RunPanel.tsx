import { Badge, Group, Paper, Tabs } from "@mantine/core";
import type { RunSnapshot, TaskNode } from "../lib/api";
import { BackendActivity } from "./BackendActivity";
import { FlowBoard } from "./flow/FlowBoard";

const STATUS_COLOR: Record<string, string> = {
  queued: "gray",
  running: "indigo",
  completed: "green",
  failed: "red",
};

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
  const terminal = snapshot?.status === "completed" || snapshot?.status === "failed";

  return (
    <Paper className="dh-panel canvas-panel" p="md">
      <Tabs key={snapshot?.status ?? "idle"} defaultValue="graph">
        <Group justify="space-between" align="center" mb="md" wrap="nowrap">
          <Tabs.List>
            <Tabs.Tab value="graph">Graph</Tabs.Tab>
            <Tabs.Tab value="activity">
              {terminal ? "History" : "Event log"}
              {eventCount > 0 && (
                <Badge size="xs" variant="light" color="gray" ml={6}>
                  {eventCount}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>
          {snapshot?.status && (
            <Badge size="sm" variant="light" color={STATUS_COLOR[snapshot.status] ?? "gray"}>
              {snapshot.status}
            </Badge>
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
