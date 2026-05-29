import { container } from "../../di/container";
import { OAUTH_SERVICE } from "@posthog/core/oauth/identifiers";
import { cancelFlowOutput } from "@posthog/core/oauth/schemas";
import type { OAuthService } from "@posthog/core/oauth/oauth";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<OAuthService>(OAUTH_SERVICE);

export const oauthRouter = router({
  cancelFlow: publicProcedure
    .output(cancelFlowOutput)
    .mutation(() => getService().cancelFlow()),
});
