import { Card, Group, Skeleton, Stack } from "@mantine/core";

export function LoadingSkeleton() {
  return (
    <Stack gap="xl">
      <Group grow>
        <Skeleton height={120} radius="md" />
        <Skeleton height={120} radius="md" />
      </Group>
      <Skeleton height={48} radius="md" />
      <Card withBorder padding="md">
        <Skeleton height={400} radius="md" />
      </Card>
    </Stack>
  );
}
