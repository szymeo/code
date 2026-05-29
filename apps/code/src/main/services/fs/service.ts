// PORT NOTE: bridge to @posthog/workspace-server fs capability. Forwards every
// call to the workspace-server FsService via WorkspaceClient. Delete when the
// remaining in-process consumer (AgentService) reads/writes repo files through
// workspace-client directly instead of injecting MAIN_TOKENS.FsService.
import type { WorkspaceClient } from "@posthog/workspace-client/client";
import type {
  BoundedReadResult,
  FileEntry,
} from "@posthog/workspace-server/services/fs/schemas";

export class FsService {
  constructor(private readonly workspace: WorkspaceClient) {}

  listRepoFiles(
    repoPath: string,
    query?: string,
    limit?: number,
  ): Promise<FileEntry[]> {
    return this.workspace.fs.listRepoFiles.query({ repoPath, query, limit });
  }

  readRepoFile(repoPath: string, filePath: string): Promise<string | null> {
    return this.workspace.fs.readRepoFile.query({ repoPath, filePath });
  }

  readRepoFiles(
    repoPath: string,
    filePaths: string[],
  ): Promise<Record<string, string | null>> {
    return this.workspace.fs.readRepoFiles.query({ repoPath, filePaths });
  }

  readRepoFileBounded(
    repoPath: string,
    filePath: string,
    maxLines: number,
  ): Promise<BoundedReadResult> {
    return this.workspace.fs.readRepoFileBounded.query({
      repoPath,
      filePath,
      maxLines,
    });
  }

  readRepoFilesBounded(
    repoPath: string,
    filePaths: string[],
    maxLines: number,
  ): Promise<Record<string, BoundedReadResult>> {
    return this.workspace.fs.readRepoFilesBounded.query({
      repoPath,
      filePaths,
      maxLines,
    });
  }

  readAbsoluteFile(filePath: string): Promise<string | null> {
    return this.workspace.fs.readAbsoluteFile.query({ filePath });
  }

  readFileAsBase64(filePath: string): Promise<string | null> {
    return this.workspace.fs.readFileAsBase64.query({ filePath });
  }

  async writeRepoFile(
    repoPath: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    await this.workspace.fs.writeRepoFile.mutate({
      repoPath,
      filePath,
      content,
    });
  }
}
