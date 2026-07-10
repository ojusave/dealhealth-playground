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
    mode === "workflows"
      ? "Render Workflows"
      : mode === "simulated"
        ? "Local simulation"
        : "Ready";

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
            <Badge variant="light" color="indigo" size="lg">
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
      <Text fw={700} size="2rem" lh={1.2} mb="xs">
        AI deal health, fan-out on Render Workflows
      </Text>
      <Text c="dimmed" maw={560} size="sm">
        Pick a model, choose a sample opportunity, and watch five parallel dimension tasks run as
        isolated workflow steps. Results merge into one scored dashboard.
      </Text>
    </Box>
  );
}

export function AppFooter() {
  return (
    <Group justify="center" gap="lg" py="xl">
      <GitHubLink />
      <Text size="sm" c="dimmed">
        ·
      </Text>
      <Text
        component="a"
        href="https://render.com/docs/workflows"
        target="_blank"
        rel="noreferrer"
        size="sm"
        c="dimmed"
        style={{ textDecoration: "none" }}
      >
        Render Workflows docs
      </Text>
    </Group>
  );
}
