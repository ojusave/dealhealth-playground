import { Button, Group, Modal, Stack, Text } from "@mantine/core";

const STEPS = [
  {
    title: "Choose the inputs",
    body: "Select a deal, then choose the model that will review it.",
  },
  {
    title: "Run five checks",
    body: "Momentum, qualification, security, commercial readiness, and execution are evaluated at the same time.",
  },
  {
    title: "Review the result",
    body: "The five outputs are merged into an overall score, risks, and recommended actions.",
  },
] as const;

export function HowItWorksModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="How a review runs" size="md" radius="md">
      <Stack gap="lg">
        {STEPS.map((step, index) => (
          <Group key={step.title} align="flex-start" wrap="nowrap" gap="md">
            <Text className="how-step-number">{index + 1}</Text>
            <Stack gap={3}>
              <Text fw={600} size="sm">{step.title}</Text>
              <Text size="sm" c="dimmed" lh={1.5}>{step.body}</Text>
            </Stack>
          </Group>
        ))}
        <Text size="xs" c="dimmed">
          Select any task in Run Explorer to inspect its score, timing, findings, and reasoning.
        </Text>
        <Group justify="flex-end">
          <Button onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
