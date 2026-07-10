import { Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

export function LoadingSkeleton() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="lg">
          <Paper className="dh-panel" p="md">
            <Skeleton height={14} width={60} mb="md" radius="sm" />
            <Skeleton height={36} radius="md" mb="sm" />
            <Skeleton height={32} radius="md" />
          </Paper>
          <Paper className="dh-panel" p="md">
            <Skeleton height={14} width={40} mb="md" radius="sm" />
            <Skeleton height={40} radius="md" />
          </Paper>
          <Skeleton height={48} radius="md" />
        </Stack>
        <Paper className="dh-panel" p="md">
          <Skeleton height={14} width={120} mb="md" radius="sm" />
          <Skeleton height={420} radius="md" />
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
