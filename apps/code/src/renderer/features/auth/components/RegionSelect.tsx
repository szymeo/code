import { RegionSelect as UiRegionSelect } from "@posthog/ui/features/auth/RegionSelect";
import { IS_DEV } from "@shared/constants/environment";
import type { CloudRegion } from "@shared/types/regions";

interface RegionSelectProps {
  region: CloudRegion;
  onRegionChange: (region: CloudRegion) => void;
  disabled?: boolean;
}

// PORT NOTE: real component is @posthog/ui/features/auth/RegionSelect. This app
// wrapper injects the host build-env flag (IS_DEV) as includeDevRegion so the
// package component stays host-agnostic. Delete when callers pass the flag.
export function RegionSelect(props: RegionSelectProps) {
  return <UiRegionSelect {...props} includeDevRegion={IS_DEV} />;
}
