import { Button, Group, Modal, Stack, Stepper, Text } from "@mantine/core";

export function HowItWorksModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="How it works" size="md" radius="md">
      <Stack gap="lg">
        <Stepper active={3} orientation="vertical" iconSize={28} color="indigo">
          <Stepper.Step label="Inputs" description="Pick a deal and a model." />
          <Stepper.Step
            label="Fan-out"
            description="Five dimension tasks run in parallel."
          />
          <Stepper.Step
            label="Merge"
            description="Results combine into one score and dashboard."
          />
        </Stepper>
        <Text size="sm" c="dimmed">
          Click a dimension node to open task details.
        </Text>
        <Group justify="flex-end">
          <Button onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
