import { container } from "../../di/container.js";
import { SUSPENSION_SERVICE } from "@posthog/workspace-server/services/suspension/identifiers";
import {
  listSuspendedTasksOutput,
  restoreTaskInput,
  restoreTaskOutput,
  suspendedTaskIdsOutput,
  suspendTaskInput,
  suspendTaskOutput,
  suspensionSettingsOutput,
  updateSuspensionSettingsInput,
} from "@posthog/workspace-server/services/suspension/schemas";
import type { SuspensionService } from "@posthog/workspace-server/services/suspension/suspension";
import { publicProcedure, router } from "../trpc.js";

const getService = () => container.get<SuspensionService>(SUSPENSION_SERVICE);

export const suspensionRouter = router({
  suspend: publicProcedure
    .input(suspendTaskInput)
    .output(suspendTaskOutput)
    .mutation(({ input }) =>
      getService().suspendTask(input.taskId, input.reason),
    ),

  restore: publicProcedure
    .input(restoreTaskInput)
    .output(restoreTaskOutput)
    .mutation(({ input }) =>
      getService().restoreTask(input.taskId, input.recreateBranch),
    ),

  list: publicProcedure
    .output(listSuspendedTasksOutput)
    .query(() => getService().getSuspendedTasks()),

  suspendedTaskIds: publicProcedure
    .output(suspendedTaskIdsOutput)
    .query(() => getService().getSuspendedTaskIds()),

  settings: publicProcedure
    .output(suspensionSettingsOutput)
    .query(() => getService().getSettings()),

  updateSettings: publicProcedure
    .input(updateSuspensionSettingsInput)
    .mutation(({ input }) => getService().updateSettings(input)),
});
