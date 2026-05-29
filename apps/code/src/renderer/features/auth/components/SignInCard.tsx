import { SignInCard as UiSignInCard } from "@posthog/ui/features/auth/SignInCard";
import { IS_DEV } from "@shared/constants/environment";
import type { CloudRegion } from "@shared/types/regions";

interface SignInCardProps {
  hogSrc: string;
  hogMessage: string;
  subtitle: string;
  onAuthInitiated?: (region: CloudRegion) => void;
}

export function SignInCard(props: SignInCardProps) {
  return <UiSignInCard {...props} includeDevRegion={IS_DEV} />;
}
