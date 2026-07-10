import {
  Anchor,
  Badge,
  Button,
  Group,
  Image,
  Text,
} from "@mantine/core";
import { renderSignupUrlWithUtms } from "../lib/renderSignup";
import { DEPLOY_URL } from "../constants";

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
    <Group justify="space-between" py="sm">
      <Group gap="sm">
        <Image src="https://render.com/favicon.ico" alt="" w={20} h={20} />
        <Text fw={600} size="lg">
          DealHealth
        </Text>
      </Group>
      <Group gap="sm">
        <Button variant="subtle" onClick={onHowItWorks}>
          How it works
        </Button>
        <Badge variant="light" color="indigo">
          {modeLabel}
        </Badge>
      </Group>
    </Group>
  );
}

export function AppFooter() {
  return (
    <Group justify="center" gap="md" py="lg">
      <Anchor href="https://github.com/ojusave/dealhealth-playground" target="_blank" size="sm" c="dimmed">
        GitHub
      </Anchor>
      <Anchor href={DEPLOY_URL} target="_blank" size="sm" c="dimmed">
        Deploy to Render
      </Anchor>
      <Anchor
        href={renderSignupUrlWithUtms("footer_link")}
        target="_blank"
        size="sm"
        c="dimmed"
      >
        Sign up on Render
      </Anchor>
    </Group>
  );
}
