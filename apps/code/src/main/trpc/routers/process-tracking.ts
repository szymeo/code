import type { ProcessTrackingService } from "@posthog/workspace-server/services/process-tracking/process-tracking";
import {
  getSnapshotInput,
  killByCategoryInput,
  killByPidInput,
  killByTaskIdInput,
  listByTaskIdInput,
} from "@posthog/workspace-server/services/process-tracking/schemas";
import { container } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<ProcessTrackingService>(MAIN_TOKENS.ProcessTrackingService);

export const processTrackingRouter = router({
  getSnapshot: publicProcedure
    .input(getSnapshotInput)
    .query(({ input }) =>
      getService().getSnapshot(input?.includeDiscovered ?? false),
    ),

  list: publicProcedure.query(() => getService().getAll()),

  kill: publicProcedure.input(killByPidInput).mutation(({ input }) => {
    getService().kill(input.pid);
  }),

  killByCategory: publicProcedure
    .input(killByCategoryInput)
    .mutation(({ input }) => {
      getService().killByCategory(input.category);
    }),

  killByTaskId: publicProcedure
    .input(killByTaskIdInput)
    .mutation(({ input }) => {
      getService().killByTaskId(input.taskId);
    }),

  listByTaskId: publicProcedure
    .input(listByTaskIdInput)
    .query(({ input }) => getService().getByTaskId(input.taskId)),

  killAll: publicProcedure.mutation(() => {
    getService().killAll();
  }),
});
