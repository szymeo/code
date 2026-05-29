// PORT NOTE: useFolders moved to @posthog/ui/features/folders (consumes
// FOLDERS_CLIENT via useService). foldersApi (non-React) stays here; it uses
// the main-router tRPC client + query cache directly.
import { trpc, trpcClient } from "@renderer/trpc";
import { queryClient } from "@utils/queryClient";
import type { RegisteredFolder } from "@posthog/ui/features/folders/ports";

export { useFolders } from "@posthog/ui/features/folders/useFolders";
export type { RegisteredFolder } from "@posthog/ui/features/folders/ports";

const invalidateFolders = () => {
  void queryClient.invalidateQueries(trpc.folders.getFolders.pathFilter());
};

export const foldersApi = {
  async getFolders() {
    return trpcClient.folders.getFolders.query();
  },
  async addFolder(folderPath: string) {
    const newFolder = await trpcClient.folders.addFolder.mutate({ folderPath });
    invalidateFolders();
    return newFolder;
  },
  async removeFolder(folderId: string) {
    const result = await trpcClient.folders.removeFolder.mutate({ folderId });
    invalidateFolders();
    return result;
  },
  async updateFolderAccessed(folderId: string) {
    return trpcClient.folders.updateFolderAccessed.mutate({ folderId });
  },
  getFolderByPath(folders: RegisteredFolder[], path: string) {
    return folders.find((f) => f.path === path);
  },
  getFolderDisplayName(folders: RegisteredFolder[], path: string) {
    if (!path) return null;
    const folder = folders.find((f) => f.path === path);
    return folder?.name ?? path.split("/").pop() ?? null;
  },
};
