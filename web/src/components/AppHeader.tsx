import { Badge, Box, Container, Group, Image, Text } from "@mantine/core";
import { GitHubLink, RenderCtas } from "./RenderCtas";

export function AppHeader({
  mode,
  onHowItWorks,
}: {
  mode: "workflows" | "simulated" | "unknown";
  onHowItWorks: () => void;
}) {
  const modeLabel =
    mode === "workflows" ? "Workflows" : mode === "simulated" ? "Simulated" : "Idle";

  return (
    <Box className="dh-header">
      <Container size="lg" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Image src="/favicon.svg" alt="" w={22} h={22} />
            <Text fw={700} size="lg" style={{ letterSpacing: "-0.02em" }}>
              DealHealth
            </Text>
          </Group>
          <Group gap="sm" wrap="nowrap" visibleFrom="sm">
            <Text
              component="button"
              type="button"
              size="sm"
              c="dimmed"
              style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
              onClick={onHowItWorks}
            >
              How it works
            </Text>
            <GitHubLink />
            <Badge variant="light" color="gray" size="lg">
              {modeLabel}
            </Badge>
            <RenderCtas signupContent="navbar_button" />
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export function AppHero() {
  return (
    <Box className="dh-hero">
      <Text fw={700} size="1.75rem" lh={1.25} mb={6}>
        DealHealth
      </Text>
      <Text c="dimmed" maw={480} size="sm">
        Score a deal across five dimensions with one model call fan-out.
      </Text>
    </Box>
  );
}

export function AppFooter() {
  return (
    <Group justify="center" gap="lg" py="xl">
      <GitHubLink />
    </Group>
  );
}
