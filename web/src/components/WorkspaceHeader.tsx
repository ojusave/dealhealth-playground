import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Image,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { DEPLOY_URL, GITHUB_URL } from "../constants";
import { renderSignupUrlWithUtms } from "../lib/renderSignup";

export function WorkspaceHeader() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  return (
    <Box className="workspace-header">
      <Group justify="space-between" h="100%" px="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Image src="/favicon.svg" alt="" w={22} h={22} />
          <Text fw={700} size="lg" style={{ whiteSpace: "nowrap" }}>
            Deal Review
          </Text>
        </Group>
        <Text className="workspace-kicker" visibleFrom="lg">
          Run Explorer
        </Text>
        <Group gap="sm" wrap="nowrap">
          <Anchor
            className="workspace-header-link"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Image
              className="github-mark"
              src="https://github.githubassets.com/favicons/favicon.svg"
              alt=""
              w={15}
              h={15}
            />
            <Text component="span" visibleFrom="sm" inherit>
              GitHub
            </Text>
          </Anchor>
          <Anchor
            className="workspace-header-link"
            href={renderSignupUrlWithUtms("header_link")}
            target="_blank"
            rel="noreferrer"
            visibleFrom="xs"
          >
            Sign up
          </Anchor>
          <Button
            component="a"
            href={DEPLOY_URL}
            target="_blank"
            rel="noreferrer"
            size="xs"
          >
            Deploy to Render
          </Button>
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
      </Group>
    </Box>
  );
}
