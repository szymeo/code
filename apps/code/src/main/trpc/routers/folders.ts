import { FOLDERS_SERVICE } from "@posthog/workspace-server/services/folders/identifiers";
import { container } from "../../di/container";
import type { FoldersService } from "@posthog/workspace-server/services/folders/folders";
import {
  addFolderInput,
  addFolderOutput,
  getFoldersOutput,
  getRepositoryByRemoteUrlInput,
  removeFolderInput,
  repositoryLookupResult,
  updateFolderAccessedInput,
} from "@posthog/workspace-server/services/folders/schemas";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<FoldersService>(FOLDERS_SERVICE);

export const foldersRouter = router({
  getFolders: publicProcedure.output(getFoldersOutput).query(() => {
    return getService().getFolders();
  }),

  addFolder: publicProcedure
    .input(addFolderInput)
    .output(addFolderOutput)
    .mutation(({ input }) => {
      return getService().addFolder(input.folderPath, {
        remoteUrl: input.remoteUrl,
      });
    }),

  removeFolder: publicProcedure
    .input(removeFolderInput)
    .mutation(({ input }) => {
      return getService().removeFolder(input.folderId);
    }),

  updateFolderAccessed: publicProcedure
    .input(updateFolderAccessedInput)
    .mutation(({ input }) => {
      return getService().updateFolderAccessed(input.folderId);
    }),

  clearAllData: publicProcedure.mutation(() => {
    return getService().clearAllData();
  }),

  getRepositoryByRemoteUrl: publicProcedure
    .input(getRepositoryByRemoteUrlInput)
    .output(repositoryLookupResult)
    .query(({ input }) => {
      return getService().getRepositoryByRemoteUrl(input.remoteUrl);
    }),

  getMostRecentlyAccessedRepository: publicProcedure
    .output(repositoryLookupResult)
    .query(() => {
      return getService().getMostRecentlyAccessedRepository();
    }),
});
