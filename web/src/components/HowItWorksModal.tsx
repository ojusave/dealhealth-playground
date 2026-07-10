import { Button, Modal, Stack, Stepper, Text } from "@mantine/core";

export function HowItWorksModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="How it works" size="md">
      <Stepper active={3} orientation="vertical" iconSize={28}>
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
              <Text size="sm" c="dimmed">
                <Text
                  component="a"
                  href="https://render.com/docs/workflows"
                  target="_blank"
                  c="indigo"
                  inherit
                >
                  Learn about Render Workflows
                </Text>
              </Text>
            </Stack>
          }
        />
      </Stepper>
      <Button fullWidth mt="lg" onClick={onClose}>
        Close
      </Button>
    </Modal>
  );
}
