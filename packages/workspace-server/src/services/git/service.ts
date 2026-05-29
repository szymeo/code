import fs from "node:fs";
import path from "node:path";
import {
  type DiffStats,
  getAllBranches,
  getChangedFilesDetailed,
  getCurrentBranch,
  getDefaultBranch,
  getDiffHead,
  getDiffStats,
  getFileAtHead,
  getLatestCommit,
  getRemoteUrl,
  getStagedDiff,
  getUnstagedDiff,
  isGitRepository,
} from "@posthog/git/queries";
import { parseGithubUrl } from "@posthog/git/utils";
import { injectable } from "inversify";
import type {
  ChangedFile,
  DetectRepoResult,
  GitCommitInfo,
  GitRepoInfo,
} from "./schemas";

@injectable()
export class GitService {
  async getDiffStats(directoryPath: string): Promise<DiffStats> {
    return getDiffStats(directoryPath);
  }

  async detectRepo(directoryPath: string): Promise<DetectRepoResult> {
    if (!directoryPath) return null;

    const remoteUrl = await getRemoteUrl(directoryPath);
    if (!remoteUrl) return null;

    const parsed = parseGithubUrl(remoteUrl);
    if (!parsed) return null;

    const branch = await getCurrentBranch(directoryPath);
    if (!branch) return null;

    return {
      organization: parsed.owner,
      repository: parsed.repo,
      remote: remoteUrl,
      branch,
    };
  }

  async validateRepo(directoryPath: string): Promise<boolean> {
    if (!directoryPath) return false;
    return isGitRepository(directoryPath);
  }

  async getRemoteUrl(directoryPath: string): Promise<string | null> {
    return getRemoteUrl(directoryPath);
  }

  async getCurrentBranch(
    directoryPath: string,
    signal?: AbortSignal,
  ): Promise<string | null> {
    return getCurrentBranch(directoryPath, { abortSignal: signal });
  }

  async getDefaultBranch(directoryPath: string): Promise<string> {
    return getDefaultBranch(directoryPath);
  }

  async getAllBranches(
    directoryPath: string,
    signal?: AbortSignal,
  ): Promise<string[]> {
    return getAllBranches(directoryPath, { abortSignal: signal });
  }

  async getChangedFilesHead(
    directoryPath: string,
    signal?: AbortSignal,
  ): Promise<ChangedFile[]> {
    const files = await getChangedFilesDetailed(directoryPath, {
      excludePatterns: [".claude", "CLAUDE.local.md"],
      abortSignal: signal,
    });
    type HeadChangedFile = Omit<ChangedFile, "patch">;
    const filteredFiles: Array<HeadChangedFile | null> = await Promise.all(
      files.map(async (file) => {
        if (file.status === "untracked") {
          try {
            const stats = await fs.promises.stat(
              path.join(directoryPath, file.path),
            );
            if (!stats.isFile()) return null;
          } catch {
            return null;
          }
        }

        return {
          path: file.path,
          status: file.status,
          originalPath: file.originalPath,
          linesAdded: file.linesAdded,
          linesRemoved: file.linesRemoved,
          staged: file.staged,
        };
      }),
    );

    return filteredFiles.filter(
      (file): file is HeadChangedFile => file !== null,
    );
  }

  async getFileAtHead(
    directoryPath: string,
    filePath: string,
    signal?: AbortSignal,
  ): Promise<string | null> {
    return getFileAtHead(directoryPath, filePath, { abortSignal: signal });
  }

  async getDiffHead(
    directoryPath: string,
    ignoreWhitespace?: boolean,
    signal?: AbortSignal,
  ): Promise<string> {
    return getDiffHead(directoryPath, {
      ignoreWhitespace,
      abortSignal: signal,
    });
  }

  async getDiffCached(
    directoryPath: string,
    ignoreWhitespace?: boolean,
    signal?: AbortSignal,
  ): Promise<string> {
    return getStagedDiff(directoryPath, {
      ignoreWhitespace,
      abortSignal: signal,
    });
  }

  async getDiffUnstaged(
    directoryPath: string,
    ignoreWhitespace?: boolean,
    signal?: AbortSignal,
  ): Promise<string> {
    return getUnstagedDiff(directoryPath, {
      ignoreWhitespace,
      abortSignal: signal,
    });
  }

  async getLatestCommit(
    directoryPath: string,
    signal?: AbortSignal,
  ): Promise<GitCommitInfo | null> {
    const commit = await getLatestCommit(directoryPath, {
      abortSignal: signal,
    });
    if (!commit) return null;
    return {
      sha: commit.sha,
      shortSha: commit.shortSha,
      message: commit.message,
      author: commit.author,
      date: commit.date,
    };
  }

  async getGitRepoInfo(directoryPath: string): Promise<GitRepoInfo | null> {
    try {
      const remoteUrl = await getRemoteUrl(directoryPath);
      if (!remoteUrl) return null;

      const parsed = parseGithubUrl(remoteUrl);
      if (!parsed) return null;

      const currentBranch = await getCurrentBranch(directoryPath);
      const defaultBranch = await getDefaultBranch(directoryPath);

      let compareUrl: string | null = null;
      if (currentBranch && currentBranch !== defaultBranch) {
        compareUrl = `https://github.com/${parsed.owner}/${parsed.repo}/compare/${defaultBranch}...${currentBranch}?expand=1`;
      }

      return {
        organization: parsed.owner,
        repository: parsed.repo,
        currentBranch: currentBranch ?? null,
        defaultBranch,
        compareUrl,
      };
    } catch {
      return null;
    }
  }
}
