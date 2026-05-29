import type { MentionItem } from "@posthog/shared/domain-types";

export interface DetectedRepo {
  organization?: string | null;
  repository?: string | null;
}

/**
 * Renderer client for host repo-file listing + repo detection (main electron-trpc
 * fs.listRepoFiles / git.detectRepo). Desktop adapter wraps trpcClient; resolved
 * via useService so packages/ui stays host-agnostic.
 */
export interface RepoFilesClient {
  listRepoFiles(repoPath: string): Promise<MentionItem[]>;
  detectRepo(directoryPath: string): Promise<DetectedRepo | null>;
}

export const REPO_FILES_CLIENT = Symbol.for("posthog.ui.repoFiles.client");
