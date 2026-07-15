import { useCallback, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import type { Dashboard, Opportunity, RunSnapshot } from "../lib/api";
import { ExecutionTrace } from "./ExecutionTrace";
import { FlowBoard } from "./flow/FlowBoard";

type Tone = "green" | "yellow" | "red";

function scoreTone(score: number): Tone {
  if (score >= 70) return "green";
  if (score >= 45) return "yellow";
  return "red";
}

function severityColor(severity: string): string {
  if (severity === "Critical") return "red";
  if (severity === "High") return "orange";
  return "yellow";
}

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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="analysis-hero-stat">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm" fw={600} lineClamp={1}>
        {value}
      </Text>
    </div>
  );
}

function ContextCard({
  title,
  note,
  rows,
}: {
  title: string;
  note?: string;
  rows: Array<[string, string]>;
}) {
  return (
    <section className="dh-panel analysis-panel analysis-context-card">
      <Text className="dh-section-title" mb="sm">
        {title}
      </Text>
      <div className="analysis-context-rows">
        {rows.map(([label, value]) => (
          <div key={label}>
            <Text size="xs" c="dimmed">
              {label}
            </Text>
            <Text size="xs" fw={500}>
              {value}
            </Text>
          </div>
        ))}
      </div>
      {note ? (
        <Text size="xs" c="dimmed" lh={1.55} className="analysis-context-note">
          {note}
        </Text>
      ) : null}
    </section>
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
  const detailRef = useRef<HTMLDivElement>(null);

  const dimension = data.dimensions.find((item) => item.name === activeDimension);
  const task = snapshot.tasks.find((item) => item.dimension === activeDimension);

  const selectDimension = useCallback((name: string) => {
    if (!name) return;
    setActiveDimension(name);
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      detailRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    });
  }, []);

  const tone = scoreTone(data.overall_score);
  const totalTasks = snapshot.tasks.length || data.dimensions.length;
  const completedTasks = snapshot.tasks.filter((item) => item.status === "completed").length;

  return (
    <Box className="analysis-report">
      <Group className="analysis-toolbar" justify="space-between" wrap="nowrap" gap="md">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <Button variant="subtle" color="gray" size="compact-sm" onClick={onBack}>
            ← Run Explorer
          </Button>
          <span className="analysis-toolbar-divider" aria-hidden />
          <Text size="sm" fw={600} lineClamp={1} style={{ minWidth: 0 }}>
            {opportunity.company}
          </Text>
          <Text size="sm" c="dimmed" visibleFrom="sm" style={{ whiteSpace: "nowrap" }}>
            · {data.meta.modelLabel}
          </Text>
        </Group>
        <Button size="sm" onClick={onRunAgain}>
          Run again
        </Button>
      </Group>

      <div className="analysis-report-body">
        <div className="analysis-layout">
          <main className="analysis-main">
            {data.meta.partial ? (
              <div className="analysis-section analysis-partial" role="status">
                <span className="step-num step-num--warn" aria-hidden>
                  !
                </span>
                <div>
                  <Text size="sm" fw={600}>
                    Partial results
                  </Text>
                  <Text size="sm" c="dimmed">
                    Some dimension checks failed, so this report scores the completed analyses
                    only.
                  </Text>
                </div>
              </div>
            ) : null}

            <section className="dh-panel analysis-panel analysis-section analysis-hero">
              <div className="analysis-hero-main">
                <div className="analysis-hero-copy">
                  <Title order={1} size="h2">
                    {opportunity.company}
                  </Title>
                  <Group gap={8} mt={4} wrap="wrap">
                    <Text size="sm" c="dimmed">
                      {opportunity.stage}
                    </Text>
                    <span className="analysis-meta-dot" aria-hidden />
                    <Text size="sm" c="dimmed">
                      {formatArr(opportunity.arr)} ARR
                    </Text>
                    <span className="analysis-meta-dot" aria-hidden />
                    <Text size="sm" c="dimmed">
                      Close {opportunity.expectedCloseDate}
                    </Text>
                  </Group>
                  <Text className="dh-section-title" mt="md">
                    Executive synthesis
                  </Text>
                  <Title order={2} className="analysis-headline" mt={6}>
                    {data.summary}
                  </Title>
                </div>
                <div className="analysis-hero-score">
                  <Text className="dh-section-title">Overall score</Text>
                  <Text component="p" className={`analysis-score analysis-score--${tone}`}>
                    {data.overall_score}
                  </Text>
                  <Badge color={tone} variant="light">
                    {data.status}
                  </Badge>
                </div>
              </div>
              <div className="analysis-hero-stats">
                <HeroStat label="Model" value={data.meta.modelLabel} />
                <HeroStat
                  label="Execution"
                  value={data.meta.mode === "workflows" ? "Render Workflows" : "Simulated"}
                />
                <HeroStat label="Duration" value={formatSeconds(data.meta.durationMs)} />
                <HeroStat label="Dimensions" value={`${completedTasks}/${totalTasks} completed`} />
              </div>
            </section>

            <section className="dh-panel analysis-panel analysis-section analysis-flow">
              <Group justify="space-between" align="center" mb="sm">
                <Text className="dh-section-title">Run graph</Text>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  {snapshot.status}
                </Text>
              </Group>
              <FlowBoard
                snapshot={snapshot}
                idle={false}
                company={opportunity.company}
                onSelectTask={(_task, dim) => selectDimension(dim)}
                embedded
              />
            </section>

            <section className="dh-panel analysis-panel analysis-section analysis-dimensions">
              <Group justify="space-between" align="center" mb="sm">
                <Text className="dh-section-title">Dimension scores</Text>
                <Text size="xs" c="dimmed">
                  Select a dimension for findings
                </Text>
              </Group>
              <SimpleGrid cols={{ base: 1, xs: 2, md: 5 }} spacing="sm">
                {data.dimensions.map((item) => {
                  const active = item.name === activeDimension;
                  const itemTone = item.failed ? null : scoreTone(item.score);
                  return (
                    <UnstyledButton
                      key={item.name}
                      className={`analysis-dimension${active ? " analysis-dimension--active" : ""}`}
                      onClick={() => selectDimension(item.name)}
                      aria-pressed={active}
                    >
                      <Group justify="space-between" gap={6} wrap="nowrap" align="flex-start">
                        <Text size="xs" fw={600} lh={1.3}>
                          {item.name}
                        </Text>
                        {item.failed ? (
                          <Badge size="xs" color="red" variant="light">
                            Failed
                          </Badge>
                        ) : null}
                      </Group>
                      <Text
                        className={`analysis-dim-score ${
                          itemTone ? `analysis-score--${itemTone}` : "analysis-dim-score--na"
                        }`}
                      >
                        {item.failed ? "—" : item.score}
                      </Text>
                      <span
                        className={`analysis-score-line ${
                          itemTone ? `analysis-score-line--${itemTone}` : "analysis-score-line--na"
                        }`}
                        aria-hidden
                      />
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>

              {dimension ? (
                <div className="analysis-detail" ref={detailRef}>
                  <Group justify="space-between" align="center" gap="xs" mb="md" wrap="wrap">
                    <Group gap="xs">
                      <Text fw={650} size="sm">
                        {dimension.name}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={task?.status === "failed" ? "red" : "green"}
                      >
                        {task?.status === "failed" ? "Failed" : "Completed"}
                      </Badge>
                    </Group>
                    {task?.durationMs != null ? (
                      <Text size="xs" ff="monospace" c="dimmed">
                        {formatSeconds(task.durationMs)}
                      </Text>
                    ) : null}
                  </Group>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <div>
                      <Text className="dh-section-title" mb={6}>
                        Findings
                      </Text>
                      <Text size="sm" lh={1.55} className="analysis-prose">
                        {dimension.findings || "No findings returned."}
                      </Text>
                      {task?.status === "failed" && task.message ? (
                        <Text size="xs" c="red" mt={6}>
                          {task.message}
                        </Text>
                      ) : null}
                    </div>
                    <div>
                      <Text className="dh-section-title" mb={6}>
                        Reasoning
                      </Text>
                      {task?.reasoning?.length ? (
                        <ol className="analysis-reasoning">
                          {task.reasoning.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No reasoning steps returned.
                        </Text>
                      )}
                    </div>
                  </SimpleGrid>
                </div>
              ) : null}
            </section>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" className="analysis-section">
              <section className="dh-panel analysis-panel analysis-list-card">
                <Text className="dh-section-title" mb="xs">
                  Top risks
                </Text>
                {data.risks.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No material risks surfaced.
                  </Text>
                ) : (
                  <div className="analysis-list">
                    {data.risks.slice(0, 5).map((risk, index) => (
                      <div
                        key={`${risk.dimension}-${risk.signal}-${index}`}
                        className="analysis-list-row"
                      >
                        <span className="step-num step-num--risk">
                          {index + 1}
                        </span>
                        <div className="analysis-list-body">
                          <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
                            <Text size="sm" fw={600} lh={1.35}>
                              {risk.signal}
                            </Text>
                            <Badge size="xs" variant="light" color={severityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed" lh={1.5}>
                            {risk.description}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="dh-panel analysis-panel analysis-list-card">
                <Text className="dh-section-title" mb="xs">
                  Next actions
                </Text>
                {data.recommendations.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No follow-up actions returned.
                  </Text>
                ) : (
                  <div className="analysis-list">
                    {data.recommendations.slice(0, 5).map((item, index) => (
                      <div key={item} className="analysis-list-row">
                        <span className="step-num step-num--action">
                          {index + 1}
                        </span>
                        <Text size="sm" lh={1.5}>
                          {item}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </SimpleGrid>

            <div className="analysis-section analysis-panel">
              <ExecutionTrace snapshot={snapshot} />
            </div>
          </main>

          <aside className="analysis-rail analysis-section">
            <Stack gap="md">
              <ContextCard
                title="Deal context"
                note={data.context.deal_context}
                rows={[
                  ["Stage", opportunity.stage],
                  ["ARR", formatArr(opportunity.arr)],
                  ["Close date", opportunity.expectedCloseDate],
                  ["Pilot", opportunity.pilotStatus],
                ]}
              />
              <ContextCard
                title="Decision path"
                note={data.context.decision_path}
                rows={[
                  ["Budget", opportunity.budgetConfirmed ? "Confirmed" : "Unconfirmed"],
                  [
                    "Economic buyer",
                    opportunity.economicBuyerIdentified ? "Identified" : "Not identified",
                  ],
                  [
                    "Executive sponsor",
                    opportunity.execSponsorEngaged ? "Engaged" : "Not engaged",
                  ],
                  ["Mutual action plan", opportunity.mutualActionPlan ? "In place" : "Missing"],
                ]}
              />
              <ContextCard
                title="Validation scope"
                note={data.context.validation_scope}
                rows={[
                  ["Discovery", opportunity.discoveryComplete ? "Complete" : "Incomplete"],
                  ["Security review", opportunity.securityReview],
                  ["Competitor", opportunity.competitorInDeal ? "Present" : "None recorded"],
                  ["Last touch", `${opportunity.daysSinceLastTouch} days ago`],
                ]}
              />
            </Stack>
          </aside>
        </div>
      </div>
    </Box>
  );
}
