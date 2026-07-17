import { Badge, Divider, Group, List, Stack, Text } from "@mantine/core";
import type { RunSnapshot, TaskNode } from "../lib/api";
import { displayRiskSignal, uniqueRiskThemes } from "../lib/risk-presentation";

function statusColor(status?: string): string {
  if (status === "completed") return "green";
  if (status === "failed") return "red";
  if (status === "running") return "indigo";
  return "gray";
}

export function InspectorPanel({
  task,
  dimension,
  snapshot,
}: {
  task: TaskNode | null;
  dimension: string;
  snapshot: RunSnapshot | null;
}) {
  const result = snapshot?.result;
  const topRisks = result ? uniqueRiskThemes(result.risks) : [];

  return (
    <Stack gap="lg" p="md">
        <Stack gap={4}>
          <Text className="workspace-kicker">{task ? "Selected task" : "Run details"}</Text>
          <Group justify="space-between" align="center">
            <Text fw={700}>{task ? dimension : "Analysis"}</Text>
            <Badge variant="light" color={statusColor(task?.status ?? snapshot?.status)}>
              {task?.status ?? snapshot?.status ?? "idle"}
            </Badge>
          </Group>
        </Stack>

        {task ? (
          <>
            <div className="metric-list">
              <span>Score</span><strong>{task.score ?? "—"}</strong>
              <span>Duration</span><strong>{task.durationMs ? `${(task.durationMs / 1000).toFixed(1)}s` : "—"}</strong>
              <span>Attempt</span><strong>{task.attempt}</strong>
              <span>Task ID</span><code>{task.taskRunId ?? "Pending"}</code>
            </div>
            {task.findings && (
              <>
                <Divider />
                <Stack gap="xs">
                  <Text className="workspace-kicker">Finding</Text>
                  <Text size="sm" lh={1.55}>{task.findings}</Text>
                </Stack>
              </>
            )}
            {task.reasoning?.length ? (
              <Stack gap="xs">
                <Text className="workspace-kicker">Reasoning</Text>
                <List size="sm" spacing={4}>
                  {task.reasoning.map((step, index) => <List.Item key={index}>{step}</List.Item>)}
                </List>
              </Stack>
            ) : null}
            {task.message && <Text size="sm" c="red">{task.message}</Text>}
          </>
        ) : (
          <Text size="sm" c="dimmed">
            {snapshot ? "Select a dimension in the graph." : "Start a run to inspect task output."}
          </Text>
        )}

        {result && (
          <>
            <Divider />
            <Stack gap="sm">
              <Text className="workspace-kicker">Top risks</Text>
              {topRisks.map((risk, index) => (
                <Group key={`${risk.signal}-${index}`} gap="sm" align="flex-start" wrap="nowrap">
                  <span className="step-num step-num--risk">{index + 1}</span>
                  <Stack gap={1}>
                    <Text size="sm" fw={600}>{displayRiskSignal(risk.signal)}</Text>
                    <Text size="xs" c="dimmed">{risk.description}</Text>
                  </Stack>
                </Group>
              ))}
            </Stack>
            <Stack gap="sm">
              <Text className="workspace-kicker">Next actions</Text>
              {result.recommendations.slice(0, 3).map((action, index) => (
                <Group key={`${action}-${index}`} gap="sm" align="flex-start" wrap="nowrap">
                  <span className="step-num step-num--action">{index + 1}</span>
                  <Text size="sm">{action}</Text>
                </Group>
              ))}
            </Stack>
          </>
        )}
    </Stack>
  );
}
