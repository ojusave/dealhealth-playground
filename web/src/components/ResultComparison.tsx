import { Alert, Badge, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { workflowOnlyRisks, type Dashboard, type Opportunity } from "@dealhealth/core";
import type { RunSnapshot } from "../lib/api";
import { displayRiskSignal, uniqueRiskThemes } from "../lib/risk-presentation";

function formatArr(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function formatSeconds(ms: number | undefined): string {
  return ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`;
}

function SignalList({
  signals,
}: {
  signals: Array<{ signal: string; description: string }>;
}) {
  return (
    <ul className="comparison-signals">
      {uniqueRiskThemes(signals).map((risk, index) => (
        <li key={`${risk.signal}-${index}`}>
          <Text size="sm" fw={600} lh={1.35}>
            {displayRiskSignal(risk.signal)}
          </Text>
          <Text size="xs" c="dimmed" lh={1.45}>
            {risk.description}
          </Text>
        </li>
      ))}
    </ul>
  );
}

export function ResultComparison({
  workflow,
  snapshot,
  opportunity,
}: {
  workflow: Dashboard;
  snapshot: RunSnapshot;
  opportunity: Opportunity;
}) {
  const baseline = snapshot.baseline;
  const additional = baseline.result
    ? uniqueRiskThemes(workflowOnlyRisks(workflow.risks, baseline.result.risks))
    : [];

  return (
    <section className="dh-panel analysis-panel analysis-section comparison-panel">
      <Stack gap={6} mb="lg">
        <Text className="demo-kicker">Same model · same deal</Text>
        <Title order={1} size="h2">
          See what one model call misses.
        </Title>
        <Group gap={8} wrap="wrap">
          <Text size="sm" c="dimmed">
            {opportunity.company}
          </Text>
          <span className="analysis-meta-dot" aria-hidden />
          <Text size="sm" c="dimmed">
            {opportunity.stage}
          </Text>
          <span className="analysis-meta-dot" aria-hidden />
          <Text size="sm" c="dimmed">
            {formatArr(opportunity.arr)} ARR
          </Text>
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <article className="comparison-result comparison-result--baseline">
          <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
            <div>
              <Text className="dh-section-title">Single call</Text>
              <Text size="sm" fw={650} mt={3}>
                One general review
              </Text>
            </div>
            <Badge color="gray" variant="light">
              {baseline.status === "completed"
                ? formatSeconds(baseline.result?.meta.durationMs)
                : baseline.status}
            </Badge>
          </Group>

          {baseline.result ? (
            <Stack gap="md" mt="lg">
              <Text size="sm" lh={1.55}>
                {baseline.result.summary}
              </Text>
              <div>
                <Text className="dh-section-title" mb={6}>
                  Risks surfaced
                </Text>
                <SignalList signals={baseline.result.risks} />
              </div>
            </Stack>
          ) : baseline.status === "failed" ? (
            <Alert color="yellow" variant="light" mt="lg" title="Baseline unavailable">
              The Workflow result is still valid. The one-call comparison failed for this run.
            </Alert>
          ) : (
            <Text size="sm" c="dimmed" mt="lg">
              The general review is still running.
            </Text>
          )}
        </article>

        <article className="comparison-result comparison-result--workflow">
          <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
            <div>
              <Text className="dh-section-title">Render Workflow</Text>
              <Text size="sm" fw={650} mt={3}>
                Five specialists + synthesis
              </Text>
            </div>
            <Group gap={6} justify="flex-end">
              <Badge color="indigo" variant="light">
                {formatSeconds(workflow.meta.durationMs)}
              </Badge>
              <Badge
                color={
                  workflow.overall_score >= 70
                    ? "green"
                    : workflow.overall_score >= 45
                      ? "yellow"
                      : "red"
                }
                variant="light"
              >
                {workflow.overall_score} · {workflow.status}
              </Badge>
            </Group>
          </Group>

          <Stack gap="md" mt="lg">
            <Text size="sm" lh={1.55}>
              {workflow.summary}
            </Text>
            <div>
              <Text className="dh-section-title" mb={6}>
                Risks surfaced
              </Text>
              <SignalList signals={workflow.risks} />
            </div>
          </Stack>
        </article>
      </SimpleGrid>

      {baseline.result ? (
        <div className="comparison-delta">
          <Text className="dh-section-title" mb={6}>
            {additional.length ? "Only the Workflow surfaced" : "What changed"}
          </Text>
          {additional.length ? (
            <ul className="comparison-only-list">
              {additional.map((risk) => (
                <li key={`${risk.dimension}-${risk.signal}`}>
                  <Text size="sm" fw={650}>
                    {displayRiskSignal(risk.signal)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {risk.dimension}
                  </Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" c="dimmed">
              Both approaches found the same top risk themes. The Workflow still adds
              dimension-level evidence, parallel execution, retries, and an inspectable trace.
            </Text>
          )}
        </div>
      ) : null}
    </section>
  );
}
