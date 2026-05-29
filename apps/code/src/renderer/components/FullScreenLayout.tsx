import { FullScreenLayout as UiFullScreenLayout } from "@posthog/ui/primitives/FullScreenLayout";
import { UpdateBanner } from "@features/sidebar/components/UpdateBanner";
import { trpcClient } from "@renderer/trpc/client";
import { EXTERNAL_LINKS } from "@utils/links";
import type { ReactNode } from "react";

interface FullScreenLayoutProps {
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

// PORT NOTE: real layout is @posthog/ui/primitives/FullScreenLayout; this app
// wrapper injects the host update banner + support-link opener.
export function FullScreenLayout(props: FullScreenLayoutProps) {
  return (
    <UiFullScreenLayout
      {...props}
      banner={<UpdateBanner variant="compact" />}
      onOpenSupport={() =>
        trpcClient.os.openExternal.mutate({ url: EXTERNAL_LINKS.discord })
      }
    />
  );
}
