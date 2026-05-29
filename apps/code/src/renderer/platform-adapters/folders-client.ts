import type {
  FoldersClient,
  RegisteredFolder,
} from "@posthog/ui/features/folders/ports";
import { trpcClient } from "@renderer/trpc/client";
import { injectable } from "inversify";

@injectable()
export class TrpcFoldersClient implements FoldersClient {
  getFolders(): Promise<RegisteredFolder[]> {
    return trpcClient.folders.getFolders.query();
  }

  addFolder(folderPath: string): Promise<RegisteredFolder> {
    return trpcClient.folders.addFolder.mutate({ folderPath });
  }

  removeFolder(folderId: string): Promise<unknown> {
    return trpcClient.folders.removeFolder.mutate({ folderId });
  }

  updateFolderAccessed(folderId: string): Promise<unknown> {
    return trpcClient.folders.updateFolderAccessed.mutate({ folderId });
  }

  selectDirectory(): Promise<string | null> {
    return trpcClient.os.selectDirectory.query();
  }

  addDefaultDirectory(path: string): Promise<unknown> {
    return trpcClient.additionalDirectories.addDefault.mutate({ path });
  }

  addDirectoryForTask(taskId: string, path: string): Promise<unknown> {
    return trpcClient.additionalDirectories.addForTask.mutate({ taskId, path });
  }
}
