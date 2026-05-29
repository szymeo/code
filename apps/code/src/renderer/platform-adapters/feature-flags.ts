import type { FeatureFlags } from "@posthog/ui/features/feature-flags/ports";
import { isFeatureFlagEnabled, onFeatureFlagsLoaded } from "@utils/analytics";
import { injectable } from "inversify";

@injectable()
export class RendererFeatureFlags implements FeatureFlags {
  isEnabled(flagKey: string): boolean {
    return isFeatureFlagEnabled(flagKey);
  }

  onFlagsLoaded(handler: () => void): () => void {
    return onFeatureFlagsLoaded(handler);
  }
}
