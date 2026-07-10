import { useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Group,
  List,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
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

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack gap={2} mb="sm">
      <Text className="dh-section-title">{title}</Text>
      {subtitle && (
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
      )}
    </Stack>
  );
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
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>Deal health dashboard</Title>
        <Text size="sm" c="dimmed">
          {data.meta.modelLabel} · {(data.meta.durationMs / 1000).toFixed(1)}s
        </Text>
      </Group>

      {data.meta.partial && (
        <Alert color="yellow" variant="light" title="Partial results">
          Some dimensions failed. The scores below reflect only the tasks that completed.
        </Alert>
      )}

      <Paper className="dh-panel" p="xl">
        <Group align="center" gap="xl" wrap="wrap">
          <RingProgress
            size={160}
            thickness={16}
            roundCaps
            sections={[{ value: data.overall_score, color: ringColor }]}
            label={
              <Stack gap={0} align="center">
                <Text ta="center" size="2rem" fw={700} lh={1}>
                  {data.overall_score}
                </Text>
                <Text ta="center" size="xs" c="dimmed">
                  / 100
                </Text>
              </Stack>
            }
          />
          <Stack gap="sm" maw={520}>
            <Badge size="lg" color={ringColor} variant="light">
              {data.status}
            </Badge>
            <Text size="md" lh={1.6}>
              {data.summary}
            </Text>
          </Stack>
        </Group>
      </Paper>

      <Paper className="dh-panel" p="md">
        <SectionHeader title="Dimension scores" subtitle="Select a bar to read findings" />
        <BarChart
          h={240}
          data={chartData}
          dataKey="dimension"
          orientation="vertical"
          yAxisProps={{ width: 148 }}
          series={[{ name: "score", color: "indigo.6" }]}
          getBarColor={(value) => scoreBandColor(value)}
          gridAxis="y"
        />
        <Group gap="xs" mt="md">
          {chartData.map((d, idx) => (
            <Button
              key={d.dimension}
              size="compact-sm"
              variant={activeDim === idx ? "filled" : "light"}
              color={activeDim === idx ? "indigo" : "gray"}
              onClick={() => setActiveDim(activeDim === idx ? null : idx)}
            >
              {d.dimension}
            </Button>
          ))}
        </Group>
        {activeDim != null && chartData[activeDim] && (
          <Paper withBorder p="md" mt="md" bg="gray.0">
            <Text size="sm" lh={1.6}>
              {chartData[activeDim].findings}
            </Text>
          </Paper>
        )}
      </Paper>

      {data.risks.length > 0 && (
        <Paper className="dh-panel" p={0}>
          <Stack p="md" pb={0}>
            <SectionHeader title="Risks" />
          </Stack>
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
                    <Table.Td fw={500}>{r.signal}</Table.Td>
                    <Table.Td c="dimmed">{r.description}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Paper className="dh-panel" p="md">
        <SectionHeader title="Recommendations" />
        <List spacing="sm" size="sm">
          {data.recommendations.map((r, i) => (
            <List.Item key={i}>{r}</List.Item>
          ))}
        </List>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {(
          [
            ["Deal context", data.context.deal_context],
            ["Decision path", data.context.decision_path],
            ["Validation scope", data.context.validation_scope],
          ] as const
        ).map(([title, body]) => (
          <Paper key={title} className="dh-panel" p="md">
            <Text fw={600} size="sm" mb="xs">
              {title}
            </Text>
            <Text size="sm" c="dimmed" lh={1.55}>
              {body}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper className="dh-panel" p="md">
        <SectionHeader title="Reasoning steps" />
        <Accordion variant="separated" radius="md">
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
      </Paper>

      <Group>
        <Button variant="default" onClick={onReanalyze}>
          Re-analyze
        </Button>
        <Button onClick={onCompare}>Run with another model</Button>
      </Group>
    </Stack>
  );
}
