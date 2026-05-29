import { OAuthControls as UiOAuthControls } from "@posthog/ui/features/auth/OAuthControls";
import { IS_DEV } from "@shared/constants/environment";
import type { CloudRegion } from "@shared/types/regions";

interface OAuthControlsProps {
  onAuthInitiated?: (region: CloudRegion) => void;
}

// PORT NOTE: real component is @posthog/ui/features/auth/OAuthControls; this
// wrapper injects the host IS_DEV flag as includeDevRegion.
export function OAuthControls(props: OAuthControlsProps = {}) {
  return <UiOAuthControls {...props} includeDevRegion={IS_DEV} />;
}
