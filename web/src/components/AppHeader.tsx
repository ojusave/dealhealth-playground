import { Anchor, Box, Container, Group, Image, Text, UnstyledButton } from "@mantine/core";
import { DEPLOY_URL, GITHUB_URL } from "../constants";
import { renderSignupUrlWithUtms } from "../lib/renderSignup";

export function AppHeader() {
  return (
    <Box className="dh-header">
      <Container size="lg" py="sm">
        <Group gap="sm" wrap="nowrap">
          <Image src="/favicon.svg" alt="" w={22} h={22} />
          <Text fw={700} size="lg" style={{ letterSpacing: "-0.02em" }}>
            Deal Review
          </Text>
        </Group>
      </Container>
    </Box>
  );
}

export function AppHero() {
  return (
    <Box className="dh-hero">
      <Text fw={700} size="1.75rem" lh={1.25} mb={6}>
        Deal Review
      </Text>
      <Text c="dimmed" maw={480} size="sm">
        Score a deal across five dimensions with one model call fan-out.
      </Text>
    </Box>
  );
}

export function AppFooter({
  mode,
  onHowItWorks,
}: {
  mode: "workflows" | "simulated" | "unknown";
  onHowItWorks: () => void;
}) {
  const modeLabel =
    mode === "workflows" ? "Workflows" : mode === "simulated" ? "Simulated" : "Idle";

  return (
    <Group justify="space-between" gap="md" px="md" py="sm" wrap="wrap">
      <Group gap="xs" className="footer-status">
        <span className={`status-dot status-dot--${mode}`} />
        <Text size="xs" c="dimmed">{modeLabel} mode</Text>
      </Group>
      <Group gap="lg" wrap="wrap">
        <UnstyledButton className="footer-link" onClick={onHowItWorks}>
          How it works
        </UnstyledButton>
        <Anchor className="footer-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <Image
            className="github-mark"
            src="https://github.githubassets.com/favicons/favicon.svg"
            alt=""
            w={14}
            h={14}
          />
          GitHub
        </Anchor>
        <Anchor className="footer-link" href={DEPLOY_URL} target="_blank" rel="noreferrer">
          Deploy to Render
        </Anchor>
        <Anchor
          className="footer-link"
          href={renderSignupUrlWithUtms("footer_link")}
          target="_blank"
          rel="noreferrer"
        >
          Sign up on Render
        </Anchor>
      </Group>
    </Group>
  );
}
