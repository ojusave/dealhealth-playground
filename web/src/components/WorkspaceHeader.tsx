import { ActionIcon, Box, Group, Image, Text, Tooltip, useMantineColorScheme } from "@mantine/core";

export function WorkspaceHeader() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <Box className="workspace-header">
      <Group justify="space-between" h="100%" px="md">
        <Group gap="sm">
          <Image src="/favicon.svg" alt="" w={22} h={22} />
          <Text fw={700} size="lg">
            DealHealth
          </Text>
        </Group>
        <Text className="workspace-kicker" visibleFrom="sm">
          Workflow canvas
        </Text>
        <Tooltip label={dark ? "Use light theme" : "Use dark theme"}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={dark ? "Use light theme" : "Use dark theme"}
            onClick={() => setColorScheme(dark ? "light" : "dark")}
          >
            {dark ? "☀" : "◐"}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
}
