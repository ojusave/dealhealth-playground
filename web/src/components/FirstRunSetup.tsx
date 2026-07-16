import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { PROVIDER_LABEL } from "../constants";
import {
  selectableProviders,
  type AppError,
  type ModelsResponse,
  type Opportunity,
} from "../lib/api";

const REVIEWERS = ["Momentum", "Qualify", "Security", "Commercial", "Execution"];

function formatArr(arr: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: arr >= 1_000_000 ? "compact" : "standard",
  }).format(arr);
}

export function FirstRunSetup({
  samples,
  opportunity,
  onOpportunityChange,
  models,
  modelId,
  onModelChange,
  canReview,
  onReview,
  catalogError,
  runError,
  rateLimitAlert,
}: {
  samples: Opportunity[];
  opportunity: Opportunity;
  onOpportunityChange: (opportunity: Opportunity) => void;
  models: ModelsResponse | null;
  modelId: string;
  onModelChange: (modelId: string) => void;
  canReview: boolean;
  onReview: () => void;
  catalogError: AppError | null;
  runError: AppError | null;
  rateLimitAlert: AppError | null;
}) {
  const modelData = models
    ? selectableProviders(models).map(([provider, group]) => ({
        group: PROVIDER_LABEL[provider] ?? provider,
        items: group.models.map((model) => ({ value: model.id, label: model.label })),
      }))
    : [];

  return (
    <Box component="main" className="first-run-shell">
      <div className="demo-stage">
        <Stack gap={6} className="demo-hero">
          <Text className="demo-kicker">Render Workflows template</Text>
          <Title order={1} className="first-run-title">
            See what one model call misses.
          </Title>
          <Text c="dimmed" size="lg">
            Same model. Same deal. One general prompt versus five coordinated reviewers.
          </Text>
        </Stack>

        <section className="demo-composer" aria-label="Deal review setup">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
              <Select
                className="demo-deal-select"
                label="Sample deal"
                data={samples.map((sample) => ({
                  value: sample.id ?? sample.company,
                  label: sample.company,
                }))}
                value={opportunity.id ?? opportunity.company}
                onChange={(id) => {
                  const sample = samples.find(
                    (item) => (item.id ?? item.company) === id
                  );
                  if (sample) onOpportunityChange({ ...sample });
                }}
                allowDeselect={false}
              />
              <Group gap="xs" className="demo-deal-meta">
                <Badge variant="light" color="indigo">
                  {opportunity.stage}
                </Badge>
                <Badge variant="light" color="gray">
                  {formatArr(opportunity.arr)} ARR
                </Badge>
                <Badge variant="light" color="gray">
                  Close {opportunity.expectedCloseDate}
                </Badge>
              </Group>
            </Group>

            <Textarea
              className="demo-context"
              label="Deal context"
              value={opportunity.notes}
              onChange={(event) =>
                onOpportunityChange({
                  ...opportunity,
                  notes: event.currentTarget.value,
                })
              }
              autosize
              minRows={2}
              maxRows={4}
              maxLength={500}
            />

            <div>
              <Text className="dh-section-title" mb="xs">
                Render Workflow: five specialist checks
              </Text>
              <div className="demo-reviewers" aria-label="Deal review dimensions">
                {REVIEWERS.map((reviewer, index) => (
                  <div className="demo-reviewer" key={reviewer}>
                    <span>{index + 1}</span>
                    <Text size="xs" fw={600}>
                      {reviewer}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            {catalogError ? (
              <Alert color="yellow" variant="light" title={catalogError.title}>
                {catalogError.message}
              </Alert>
            ) : null}
            {runError ? (
              <Alert color="red" variant="light" title={runError.title}>
                {runError.message}
                {runError.hint ? (
                  <Text size="sm" mt="xs" c="dimmed">
                    {runError.hint}
                  </Text>
                ) : null}
              </Alert>
            ) : null}
            {rateLimitAlert ? (
              <Alert color="yellow" variant="light" title={rateLimitAlert.title}>
                {rateLimitAlert.message}
                {rateLimitAlert.hint ? (
                  <Text size="sm" mt="xs" c="dimmed">
                    {rateLimitAlert.hint}
                  </Text>
                ) : null}
              </Alert>
            ) : null}

            <Group className="demo-composer-action" justify="space-between" align="flex-end">
              <Select
                className="demo-model-select"
                label="Model"
                aria-label="AI model"
                searchable
                nothingFoundMessage="No match"
                disabled={modelData.length === 0}
                value={modelId}
                onChange={(id) => id && onModelChange(id)}
                data={modelData}
                allowDeselect={false}
              />
              <Button
                size="lg"
                disabled={!canReview}
                onClick={onReview}
                rightSection={<span aria-hidden>→</span>}
              >
                Compare approaches
              </Button>
            </Group>
          </Stack>
        </section>
      </div>
    </Box>
  );
}
