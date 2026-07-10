import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import type { Dashboard, Opportunity, RunSnapshot } from "../lib/api";
import { ExecutionTrace } from "./ExecutionTrace";

function scoreColor(score: number): string {
  if (score >= 70) return "green";
  if (score >= 45) return "yellow";
  return "red";
}

function formatArr(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function ContextCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <Paper className="analysis-context-card" p="md">
      <Text fw={650} size="sm" mb="sm">{title}</Text>
      <div className="analysis-context-rows">
        {rows.map(([label, value]) => (
          <div key={label}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="xs" fw={500}>{value}</Text>
          </div>
        ))}
      </div>
    </Paper>
  );
}

export function AnalysisReport({
  data,
  opportunity,
  snapshot,
  onBack,
  onRunAgain,
}: {
  data: Dashboard;
  opportunity: Opportunity;
  snapshot: RunSnapshot;
  onBack: () => void;
  onRunAgain: () => void;
}) {
  const [activeDimension, setActiveDimension] = useState(data.dimensions[0]?.name ?? "");
  const dimension = data.dimensions.find((item) => item.name === activeDimension);
  const task = snapshot.tasks.find((item) => item.dimension === activeDimension);

  return (
    <Box className="analysis-report">
      <Group className="analysis-toolbar" justify="space-between" wrap="wrap">
        <Group gap="sm">
          <Button variant="subtle" color="gray" onClick={onBack}>← Run Explorer</Button>
          <Text size="xs" c="dimmed">{data.meta.modelLabel}</Text>
        </Group>
        <Button onClick={onRunAgain}>Run again</Button>
      </Group>

      <Box className="analysis-report-body">
        <div className="analysis-layout">
          <div>
            <Stack gap="lg">
              <Box>
                <Title order={1} size="h2">{opportunity.company}</Title>
                <Group gap="md" mt={4}>
                  <Text size="sm" c="dimmed">{opportunity.stage}</Text>
                  <Text size="sm" c="dimmed">{formatArr(opportunity.arr)} ARR</Text>
                  <Text size="sm" c="dimmed">Close {opportunity.expectedCloseDate}</Text>
                </Group>
              </Box>

              {data.meta.partial ? (
                <Paper withBorder p="sm">
                  <Text size="sm">Some checks failed. This report uses the completed results.</Text>
                </Paper>
              ) : null}

              <div className="analysis-synthesis">
                <Stack gap={4}>
                  <Text className="dh-section-title">Executive synthesis</Text>
                  <Title order={2} size="h3">{data.summary}</Title>
                </Stack>
                <Stack gap={4} align="flex-end">
                  <Text className={`analysis-score analysis-score--${scoreColor(data.overall_score)}`}>
                    {data.overall_score}
                  </Text>
                  <Badge color={scoreColor(data.overall_score)} variant="outline">
                    {data.status}
                  </Badge>
                </Stack>
              </div>

              <Box>
                <Text className="dh-section-title" mb="sm">Dimension scores</Text>
                <SimpleGrid cols={{ base: 1, xs: 2, md: 5 }} spacing="sm">
                  {data.dimensions.map((item) => (
                    <UnstyledButton
                      key={item.name}
                      className={`analysis-dimension ${activeDimension === item.name ? "analysis-dimension--active" : ""}`}
                      onClick={() => setActiveDimension(item.name)}
                    >
                      <Text size="xs" fw={600} lh={1.25}>{item.name}</Text>
                      <Text size="2rem" fw={500} c={`${scoreColor(item.score)}.7`}>{item.score}</Text>
                      <div className={`analysis-score-line analysis-score-line--${scoreColor(item.score)}`} />
                    </UnstyledButton>
                  ))}
                </SimpleGrid>
              </Box>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Box>
                  <Text className="dh-section-title" mb="sm">Top risks</Text>
                  <Stack gap={0}>
                    {data.risks.slice(0, 5).map((risk) => (
                      <Group key={`${risk.dimension}-${risk.signal}`} className="analysis-list-row" wrap="nowrap">
                        <Text c="red.6">△</Text>
                        <Text size="sm">{risk.signal}: {risk.description}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Text className="dh-section-title" mb="sm">Next actions</Text>
                  <Stack gap={0}>
                    {data.recommendations.slice(0, 5).map((item) => (
                      <Group key={item} className="analysis-list-row" wrap="nowrap">
                        <Text c="green.6">○</Text>
                        <Text size="sm">{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Box>
              </SimpleGrid>

              <ExecutionTrace snapshot={snapshot} />

              {dimension ? (
                <Paper className="analysis-detail" p="md">
                  <Group justify="space-between" mb="sm">
                    <Text fw={650}>{dimension.name}</Text>
                    <Badge color="green" variant="light">Completed</Badge>
                  </Group>
                  <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <Box>
                      <Text className="dh-section-title" mb={6}>Findings</Text>
                      <Text size="sm" lh={1.55}>{dimension.findings}</Text>
                    </Box>
                    <Box>
                      <Text className="dh-section-title" mb={6}>Reasoning</Text>
                      <Text size="sm" lh={1.55}>{task?.reasoning?.join(" ") || "No reasoning returned."}</Text>
                    </Box>
                  </SimpleGrid>
                </Paper>
              ) : null}
            </Stack>
          </div>

          <div>
            <Stack gap="md">
              <ContextCard
                title="Deal context"
                rows={[
                  ["Stage", opportunity.stage],
                  ["ARR", formatArr(opportunity.arr)],
                  ["Close date", opportunity.expectedCloseDate],
                  ["Pilot", opportunity.pilotStatus],
                ]}
              />
              <ContextCard
                title="Decision path"
                rows={[
                  ["Budget", opportunity.budgetConfirmed ? "Confirmed" : "Unconfirmed"],
                  ["Economic buyer", opportunity.economicBuyerIdentified ? "Identified" : "Not identified"],
                  ["Executive sponsor", opportunity.execSponsorEngaged ? "Engaged" : "Not engaged"],
                  ["Mutual action plan", opportunity.mutualActionPlan ? "In place" : "Missing"],
                ]}
              />
              <ContextCard
                title="Validation scope"
                rows={[
                  ["Discovery", opportunity.discoveryComplete ? "Complete" : "Incomplete"],
                  ["Security review", opportunity.securityReview],
                  ["Competitor", opportunity.competitorInDeal ? "Present" : "None recorded"],
                  ["Last touch", `${opportunity.daysSinceLastTouch} days ago`],
                ]}
              />
            </Stack>
          </div>
        </div>
      </Box>
    </Box>
  );
}
