import { useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  List,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { BarChart } from "@mantine/charts";
import type { Dashboard } from "../lib/api";

function statusColor(status: string): string {
  if (status === "Healthy") return "green";
  if (status === "At Risk") return "yellow";
  return "red";
}

function scoreBandColor(score: number): string {
  if (score >= 70) return "green.6";
  if (score >= 45) return "yellow.6";
  return "red.6";
}

export function DashboardView({
  data,
  onReanalyze,
  onCompare,
}: {
  data: Dashboard;
  onReanalyze: () => void;
  onCompare: () => void;
}) {
  const [activeDim, setActiveDim] = useState<number | null>(null);
  const chartData = data.dimensions.map((d) => ({
    dimension: d.name,
    score: d.score,
    findings: d.findings,
    failed: d.failed,
  }));

  const ringColor = statusColor(data.status);

  return (
    <Stack gap="xl" mt="xl">
      {data.meta.partial && (
        <Alert color="yellow" variant="light" title="Partial results">
          Some dimensions failed. The scores below reflect only the tasks that completed.
        </Alert>
      )}

      <Card withBorder padding="lg">
        <Group align="center" gap="xl" wrap="wrap">
          <RingProgress
            size={140}
            thickness={14}
            roundCaps
            sections={[{ value: data.overall_score, color: ringColor }]}
            label={
              <Text ta="center" size="xl" fw={700}>
                {data.overall_score}
              </Text>
            }
          />
          <Stack gap="xs">
            <Badge size="lg" color={ringColor} variant="light">
              {data.status}
            </Badge>
            <Text c="dimmed" size="sm">
              {data.meta.modelLabel} · {(data.meta.durationMs / 1000).toFixed(1)}s
            </Text>
          </Stack>
        </Group>
      </Card>

      <Text size="sm" maw={640}>
        {data.summary}
      </Text>

      <Card withBorder padding="md">
        <BarChart
          h={220}
          data={chartData}
          dataKey="dimension"
          orientation="vertical"
          yAxisProps={{ width: 140 }}
          series={[{ name: "score", color: "indigo.6" }]}
          getBarColor={(value) => scoreBandColor(value)}
        />
        <Stack gap="xs" mt="md">
          <Text size="sm" c="dimmed">
            Select a dimension to read findings
          </Text>
          <Group gap="xs">
            {chartData.map((d, idx) => (
              <Button
                key={d.dimension}
                size="compact-sm"
                variant={activeDim === idx ? "filled" : "light"}
                onClick={() => setActiveDim(idx)}
              >
                {d.dimension}
              </Button>
            ))}
          </Group>
        </Stack>
        <Collapse expanded={activeDim != null}>
          {activeDim != null && chartData[activeDim] && (
            <Text size="sm" c="dimmed" mt="md">
              {chartData[activeDim].findings}
            </Text>
          )}
        </Collapse>
      </Card>

      {data.risks.length > 0 && (
        <Card withBorder padding={0}>
          <Table.ScrollContainer minWidth={480}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Severity</Table.Th>
                  <Table.Th>Signal</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.risks.map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={
                          r.severity.toLowerCase() === "high"
                            ? "red"
                            : r.severity.toLowerCase() === "medium"
                              ? "yellow"
                              : "gray"
                        }
                      >
                        {r.severity}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{r.signal}</Table.Td>
                    <Table.Td c="dimmed">{r.description}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          Recommendations
        </Text>
        <List spacing="xs" size="sm">
          {data.recommendations.map((r, i) => (
            <List.Item key={i}>{r}</List.Item>
          ))}
        </List>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card withBorder padding="md">
          <Text fw={600} size="sm" mb="xs">
            Deal context
          </Text>
          <Text size="sm" c="dimmed">
            {data.context.deal_context}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text fw={600} size="sm" mb="xs">
            Decision path
          </Text>
          <Text size="sm" c="dimmed">
            {data.context.decision_path}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text fw={600} size="sm" mb="xs">
            Validation scope
          </Text>
          <Text size="sm" c="dimmed">
            {data.context.validation_scope}
          </Text>
        </Card>
      </SimpleGrid>

      <Accordion variant="separated">
        {data.reasoning.map((r) => (
          <Accordion.Item key={r.dimension} value={r.dimension}>
            <Accordion.Control>{r.dimension}</Accordion.Control>
            <Accordion.Panel>
              <List size="sm" spacing="xs">
                {r.steps.map((s, i) => (
                  <List.Item key={i}>{s}</List.Item>
                ))}
              </List>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <Group>
        <Button variant="default" onClick={onReanalyze}>
          Re-analyze
        </Button>
        <Button onClick={onCompare}>Run with another model</Button>
      </Group>
    </Stack>
  );
}
