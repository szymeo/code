export interface RegisteredFolder {
  id: string;
  path: string;
  name: string;
  remoteUrl: string | null;
  lastAccessed: string;
  createdAt: string;
  exists?: boolean;
}

/**
 * Renderer client for the host folders + additional-directories + directory
 * picker (all on the main electron-trpc router). Desktop adapter wraps
 * trpcClient.folders.* / additionalDirectories.* / os.selectDirectory; resolved
 * via useService so packages/ui stays host-agnostic.
 */
export interface FoldersClient {
  getFolders(): Promise<RegisteredFolder[]>;
  addFolder(folderPath: string): Promise<RegisteredFolder>;
  removeFolder(folderId: string): Promise<unknown>;
  updateFolderAccessed(folderId: string): Promise<unknown>;
  selectDirectory(): Promise<string | null>;
  addDefaultDirectory(path: string): Promise<unknown>;
  addDirectoryForTask(taskId: string, path: string): Promise<unknown>;
}

export const FOLDERS_CLIENT = Symbol.for("posthog.ui.folders.client");
