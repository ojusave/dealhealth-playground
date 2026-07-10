import {
  Drawer,
  List,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { TaskNode } from "../lib/api";

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
      title={dimension || "Task details"}
      size={mobile ? "100%" : "md"}
    >
      {!node ? (
        <Text c="dimmed" size="sm">
          Select a dimension node to inspect its task run.
        </Text>
      ) : (
        <Stack gap="md">
          <Table variant="vertical" withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th w={140}>Status</Table.Th>
                <Table.Td>{node.status}</Table.Td>
              </Table.Tr>
              {node.durationMs != null && (
                <Table.Tr>
                  <Table.Th>Duration</Table.Th>
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
                  <Table.Td>{node.score}</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          {node.findings && (
            <Stack gap={4}>
              <Text fw={600} size="sm">
                Findings
              </Text>
              <Text size="sm" c="dimmed">
                {node.findings}
              </Text>
            </Stack>
          )}

          {node.reasoning && node.reasoning.length > 0 && (
            <Stack gap={4}>
              <Text fw={600} size="sm">
                Reasoning
              </Text>
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
