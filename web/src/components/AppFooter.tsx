import { Anchor, Group, Image, Text, UnstyledButton } from "@mantine/core";
import { DEPLOY_URL, GITHUB_URL } from "../constants";
import { renderSignupUrlWithUtms } from "../lib/renderSignup";

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
