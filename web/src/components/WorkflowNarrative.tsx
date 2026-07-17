import { Alert, Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import type { RunSnapshot } from "../lib/api";

function copyFor(snapshot: RunSnapshot | null, dispatching: boolean) {
  if (dispatching || !snapshot) {
    return {
      title: "Running the same model two ways",
      body: "One general call starts alongside five specialist checks.",
    };
  }
  if (snapshot.status === "queued") {
    return {
      title: "Five specialist checks are queued",
      body: "The single call is running while each dimension waits for its own task.",
    };
  }
  if (snapshot.status === "running") {
    return {
      title: "Five specialist checks are running in parallel",
      body: "The baseline uses one call; each Workflow task returns focused evidence.",
    };
  }
  if (snapshot.status === "completed") {
    return {
      title: "The comparison is ready",
      body: "The single-call output is paired with the Workflow verdict and execution trace.",
    };
  }
  return {
    title: "This review stopped before a report was ready",
    body: "Your selected deal and model are still here. Retry when the service is available.",
  };
}

export function WorkflowNarrative({
  snapshot,
  dispatching,
  onRetry,
  retryDisabled,
}: {
  snapshot: RunSnapshot | null;
  dispatching: boolean;
  onRetry: () => void;
  retryDisabled: boolean;
}) {
  const copy = copyFor(snapshot, dispatching);
  const failed = snapshot?.status === "failed";
  const modeLabel = !snapshot
    ? "Run orchestration"
    : snapshot.mode === "workflows"
      ? "Render Workflows"
      : "Local parallel run";

  if (failed) {
    return (
      <Alert
        color="red"
        variant="light"
        title={copy.title}
        className="workflow-narrative workflow-narrative--failed"
      >
        <Stack gap="sm">
          <Text size="sm">{snapshot.error ?? copy.body}</Text>
          <Text size="sm" c="dimmed">
            {copy.body}
          </Text>
          <Button
            size="sm"
            onClick={onRetry}
            disabled={retryDisabled}
            style={{ alignSelf: "flex-start" }}
          >
            Try again
          </Button>
        </Stack>
      </Alert>
    );
  }

  return (
    <Paper className="dh-panel workflow-narrative" p="md" role="status" aria-live="polite">
      <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
        <Stack gap={4}>
          <Text fw={650} size="sm">
            {copy.title}
          </Text>
          <Text size="sm" c="dimmed" lh={1.5}>
            {copy.body}
            {snapshot?.mode === "workflows" &&
            (snapshot.status === "queued" || snapshot.status === "running")
              ? " Render manages queueing and retries."
              : snapshot?.mode === "simulated" &&
                  (snapshot.status === "queued" || snapshot.status === "running")
                ? " This local preview uses the same five-way fan-out in process."
              : ""}
          </Text>
        </Stack>
        <Badge color={snapshot?.mode === "simulated" ? "gray" : "indigo"} variant="light">
          {modeLabel}
        </Badge>
      </Group>
    </Paper>
  );
}
