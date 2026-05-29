import { container } from "../../di/container.js";
import {
  startLinearFlowInput,
  startLinearFlowOutput,
} from "../../services/linear-integration/schemas.js";
import { LINEAR_INTEGRATION_SERVICE } from "@posthog/core/integrations/identifiers";
import type { LinearIntegrationService } from "@posthog/core/integrations/linear";
import { publicProcedure, router } from "../trpc.js";

const getService = () =>
  container.get<LinearIntegrationService>(LINEAR_INTEGRATION_SERVICE);

export const linearIntegrationRouter = router({
  startFlow: publicProcedure
    .input(startLinearFlowInput)
    .output(startLinearFlowOutput)
    .mutation(({ input }) =>
      getService().startFlow(input.region, input.projectId),
    ),
});
