import { Anchor, Button, Group } from "@mantine/core";
import { DEPLOY_URL } from "../constants";
import { renderSignupUrlWithUtms } from "../lib/renderSignup";

type Props = {
  signupContent?: "navbar_button" | "hero_cta" | "footer_link";
  showDeployImage?: boolean;
  size?: "compact-sm" | "sm" | "md";
};

/** Deploy + Sign up CTAs. Prefer footer placement. */
export function RenderCtas({
  signupContent = "footer_link",
  showDeployImage = false,
  size = "compact-sm",
}: Props) {
  return (
    <Group gap="xs" wrap="nowrap">
      {showDeployImage ? (
        <Anchor
          href={DEPLOY_URL}
          target="_blank"
          rel="noreferrer"
          className="dh-deploy-btn"
          aria-label="Deploy to Render"
        >
          <img
            src="https://render.com/images/deploy-to-render-button.svg"
            alt="Deploy to Render"
            height={size === "md" ? 40 : 32}
          />
        </Anchor>
      ) : (
        <Button
          component="a"
          href={DEPLOY_URL}
          target="_blank"
          rel="noreferrer"
          variant="filled"
          size={size}
        >
          Deploy to Render
        </Button>
      )}
      <Button
        component="a"
        href={renderSignupUrlWithUtms(signupContent)}
        target="_blank"
        rel="noreferrer"
        variant="outline"
        size={size}
      >
        Sign up on Render
      </Button>
    </Group>
  );
}
