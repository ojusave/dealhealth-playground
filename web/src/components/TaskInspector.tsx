import {
  Badge,
  Drawer,
  List,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { TaskNode } from "../lib/api";

function statusColor(status: string): string {
  if (status === "completed") return "green";
  if (status === "failed") return "red";
  if (status === "running") return "indigo";
  return "gray";
}

export function TaskInspector({
  node,
  dimension,
  opened,
  onClose,
}: {
  node: TaskNode | null;
  dimension: string;
  opened: boolean;
  onClose: () => void;
}) {
  const mobile = useMediaQuery("(max-width: 48em)");

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title={
        <Stack gap={2}>
          <Text className="dh-section-title">Task inspector</Text>
          <Title order={4}>{dimension || "Details"}</Title>
        </Stack>
      }
      size={mobile ? "100%" : "md"}
      padding="lg"
    >
      {!node ? (
        <Text c="dimmed" size="sm">
          Select a dimension node to inspect its task run.
        </Text>
      ) : (
        <Stack gap="lg">
          <Badge size="lg" color={statusColor(node.status)} variant="light">
            {node.status}
          </Badge>

          <Table variant="vertical" withTableBorder layout="fixed">
            <Table.Tbody>
              {node.durationMs != null && (
                <Table.Tr>
                  <Table.Th w={140}>Duration</Table.Th>
                  <Table.Td ff="monospace">{(node.durationMs / 1000).toFixed(1)}s</Table.Td>
                </Table.Tr>
              )}
              {node.taskRunId && (
                <Table.Tr>
                  <Table.Th>Task run id</Table.Th>
                  <Table.Td ff="monospace" style={{ wordBreak: "break-all" }}>
                    {node.taskRunId}
                  </Table.Td>
                </Table.Tr>
              )}
              {node.attempt > 1 && (
                <Table.Tr>
                  <Table.Th>Attempt</Table.Th>
                  <Table.Td>{node.attempt}</Table.Td>
                </Table.Tr>
              )}
              {node.score != null && (
                <Table.Tr>
                  <Table.Th>Score</Table.Th>
                  <Table.Td fw={600}>{node.score}</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {node.findings && (
            <Stack gap={6}>
              <Text className="dh-section-title">Findings</Text>
              <Text size="sm" lh={1.6}>
                {node.findings}
              </Text>
            </Stack>
          )}

          {node.reasoning && node.reasoning.length > 0 && (
            <Stack gap={6}>
              <Text className="dh-section-title">Reasoning</Text>
              <List size="sm" spacing="xs">
                {node.reasoning.map((step, i) => (
                  <List.Item key={i}>{step}</List.Item>
                ))}
              </List>
            </Stack>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
