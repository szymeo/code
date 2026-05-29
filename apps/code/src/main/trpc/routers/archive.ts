import { ARCHIVE_SERVICE } from "@posthog/workspace-server/services/archive/identifiers";
import { container } from "../../di/container";
import type { ArchiveService } from "@posthog/workspace-server/services/archive/archive";
import {
  archivedTaskIdsOutput,
  archiveTaskInput,
  archiveTaskOutput,
  deleteArchivedTaskInput,
  deleteArchivedTaskOutput,
  listArchivedTasksOutput,
  unarchiveTaskInput,
  unarchiveTaskOutput,
} from "@posthog/workspace-server/services/archive/schemas";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<ArchiveService>(ARCHIVE_SERVICE);

export const archiveRouter = router({
  archive: publicProcedure
    .input(archiveTaskInput)
    .output(archiveTaskOutput)
    .mutation(({ input }) => getService().archiveTask(input)),

  unarchive: publicProcedure
    .input(unarchiveTaskInput)
    .output(unarchiveTaskOutput)
    .mutation(({ input }) =>
      getService().unarchiveTask(input.taskId, input.recreateBranch),
    ),

  list: publicProcedure
    .output(listArchivedTasksOutput)
    .query(() => getService().getArchivedTasks()),

  archivedTaskIds: publicProcedure
    .output(archivedTaskIdsOutput)
    .query(() => getService().getArchivedTaskIds()),

  delete: publicProcedure
    .input(deleteArchivedTaskInput)
    .output(deleteArchivedTaskOutput)
    .mutation(({ input }) => getService().deleteArchivedTask(input.taskId)),
});
