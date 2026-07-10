import { Button, Group, Modal, Paper, Stack, Stepper, Text } from "@mantine/core";

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
        <Stepper active={3} orientation="vertical" iconSize={30} color="indigo">
          <Stepper.Step label="Pick inputs" description="Choose a model and a sample deal." />
          <Stepper.Step
            label="Fan out"
            description="Analyze starts five parallel tasks, one per health dimension."
          />
          <Stepper.Step
            label="Merge on Render"
            description={
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Each task runs as an isolated workflow step on Render. Close the tab and the run
                  still finishes. Results stream back and merge into one dashboard.
                </Text>
                <Text
                  component="a"
                  href="https://render.com/docs/workflows"
                  target="_blank"
                  c="indigo"
                  size="sm"
                  style={{ textDecoration: "none" }}
                >
                  Learn about Render Workflows →
                </Text>
              </Stack>
            }
          />
        </Stepper>
        <Paper withBorder p="md" bg="gray.0">
          <Text size="sm" c="dimmed">
            Tip: click any dimension node during a run to inspect task timing, findings, and
            reasoning in the side drawer.
          </Text>
        </Paper>
        <Group justify="flex-end">
          <Button onClick={onClose}>Got it</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
