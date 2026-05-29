import { container } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import type { ExternalAppsService } from "@posthog/workspace-server/services/external-apps/external-apps";
import {
  copyPathInput,
  getDetectedAppsOutput,
  getLastUsedOutput,
  openInAppInput,
  openInAppOutput,
  setLastUsedInput,
} from "@posthog/workspace-server/services/external-apps/schemas";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<ExternalAppsService>(MAIN_TOKENS.ExternalAppsService);

export const externalAppsRouter = router({
  getDetectedApps: publicProcedure
    .output(getDetectedAppsOutput)
    .query(() => getService().getDetectedApps()),

  openInApp: publicProcedure
    .input(openInAppInput)
    .output(openInAppOutput)
    .mutation(({ input }) =>
      getService().openInApp(input.appId, input.targetPath),
    ),

  setLastUsed: publicProcedure
    .input(setLastUsedInput)
    .mutation(({ input }) => getService().setLastUsed(input.appId)),

  getLastUsed: publicProcedure
    .output(getLastUsedOutput)
    .query(() => getService().getLastUsed()),

  copyPath: publicProcedure
    .input(copyPathInput)
    .mutation(({ input }) => getService().copyPath(input.targetPath)),
});
