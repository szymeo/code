import { useService } from "@posthog/di/react";
import type { MentionItem } from "@posthog/shared/domain-types";
import { useQuery } from "@tanstack/react-query";
import { byLengthAsc, Fzf } from "fzf";
import { useMemo } from "react";
import { REPO_FILES_CLIENT, type RepoFilesClient } from "./ports";

export interface FileItem {
  path: string;
  name: string;
  dir: string;
  kind: "file" | "directory";
}

const MENTION_DISPLAY_LIMIT = 20;

export function pathToFileItem(path: string): FileItem {
  const parts = path.split("/");
  const name = parts.pop() ?? path;
  const dir = parts.join("/");
  return { path, name, dir, kind: "file" };
}

function pathToFolderItem(path: string): FileItem {
  const parts = path.split("/");
  const name = parts.pop() ?? path;
  const dir = parts.join("/");
  return { path, name, dir, kind: "directory" };
}

export function transformRawFiles(
  rawFiles: MentionItem[],
  includeDirectories: boolean,
): FileItem[] {
  return rawFiles
    .filter((file): file is MentionItem & { path: string } => !!file.path)
    .filter((file) => includeDirectories || file.kind !== "directory")
    .map((file) =>
      file.kind === "directory"
        ? pathToFolderItem(file.path)
        : pathToFileItem(file.path),
    );
}

export function createFzf(files: FileItem[]): Fzf<FileItem[]> {
  return new Fzf(files, {
    selector: (item) =>
      item.kind === "directory"
        ? `${item.name}/ ${item.path}/`
        : `${item.name} ${item.path}`,
    limit: MENTION_DISPLAY_LIMIT,
    tiebreakers: [byLengthAsc],
  });
}

export function useRepoFiles(
  repoPath: string | undefined,
  enabled = true,
  options: { includeDirectories?: boolean } = {},
) {
  const { includeDirectories = false } = options;
  const client = useService<RepoFilesClient>(REPO_FILES_CLIENT);
  const { data: rawFiles, isLoading } = useQuery({
    queryKey: ["repo-files", repoPath ?? ""],
    queryFn: () => client.listRepoFiles(repoPath ?? ""),
    enabled: enabled && !!repoPath,
  });

  const files: FileItem[] = useMemo(() => {
    if (!rawFiles) return [];
    return transformRawFiles(rawFiles, includeDirectories);
  }, [rawFiles, includeDirectories]);

  const fzf = useMemo(() => createFzf(files), [files]);

  return { files, fzf, isLoading };
}

export function searchFiles(
  fzf: Fzf<FileItem[]>,
  files: FileItem[],
  query: string,
): FileItem[] {
  if (!query.trim()) {
    return files.slice(0, MENTION_DISPLAY_LIMIT);
  }
  const results = fzf.find(query);
  return results.map((result) => result.item);
}
