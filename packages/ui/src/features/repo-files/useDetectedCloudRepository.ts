import { useService } from "@posthog/di/react";
import { useQuery } from "@tanstack/react-query";
import { REPO_FILES_CLIENT, type RepoFilesClient } from "./ports";

export function useDetectedCloudRepository(
  folderPath: string | null | undefined,
): string | null {
  const client = useService<RepoFilesClient>(REPO_FILES_CLIENT);
  const { data } = useQuery({
    queryKey: ["detect-repo", folderPath ?? ""],
    queryFn: () => client.detectRepo(folderPath ?? ""),
    enabled: !!folderPath,
    staleTime: 60_000,
  });

  if (!data?.organization || !data?.repository) return null;
  return `${data.organization}/${data.repository}`.toLowerCase();
}
