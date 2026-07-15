import { Group, Text, UnstyledButton } from "@mantine/core";

export function AppFooter({ onHowItWorks }: { onHowItWorks: () => void }) {
  return (
    <Group justify="space-between" gap="md" px="md" py="sm" wrap="wrap">
      <Text size="xs" c="dimmed">
        Deal Review — a Render Workflows template
      </Text>
      <UnstyledButton className="footer-link" onClick={onHowItWorks}>
        How it works
      </UnstyledButton>
    </Group>
  );
}
