import { useService } from "@posthog/di/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { FOLDERS_CLIENT, type FoldersClient } from "./ports";

const FOLDERS_QUERY_KEY = ["folders"] as const;

export function useFolders() {
  const client = useService<FoldersClient>(FOLDERS_CLIENT);
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: () => client.getFolders(),
    staleTime: 30_000,
  });

  const existingFolders = useMemo(
    () => folders.filter((f) => f.exists !== false),
    [folders],
  );

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
  }, [queryClient]);

  const addFolderMutation = useMutation({
    mutationFn: (folderPath: string) => client.addFolder(folderPath),
    onSuccess: invalidate,
  });

  const removeFolderMutation = useMutation({
    mutationFn: (folderId: string) => client.removeFolder(folderId),
    onSuccess: invalidate,
  });

  const updateAccessedMutation = useMutation({
    mutationFn: (folderId: string) => client.updateFolderAccessed(folderId),
  });

  const addFolder = useCallback(
    (folderPath: string) => addFolderMutation.mutateAsync(folderPath),
    [addFolderMutation],
  );

  const removeFolder = useCallback(
    (folderId: string) => removeFolderMutation.mutateAsync(folderId),
    [removeFolderMutation],
  );

  const updateLastAccessed = useCallback(
    (folderId: string) => {
      updateAccessedMutation.mutate(folderId);
    },
    [updateAccessedMutation],
  );

  const getFolderByPath = useCallback(
    (path: string) => existingFolders.find((f) => f.path === path),
    [existingFolders],
  );

  const getRecentFolders = useCallback(
    (limit = 5) =>
      [...existingFolders]
        .sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime(),
        )
        .slice(0, limit),
    [existingFolders],
  );

  const getFolderDisplayName = useCallback(
    (path: string) => {
      if (!path) return null;
      const folder = existingFolders.find((f) => f.path === path);
      return folder?.name ?? path.split("/").pop() ?? null;
    },
    [existingFolders],
  );

  const loadFolders = useCallback(() => invalidate(), [invalidate]);

  return {
    folders: existingFolders,
    isLoaded: !isLoading,
    addFolder,
    removeFolder,
    updateLastAccessed,
    getFolderByPath,
    getRecentFolders,
    getFolderDisplayName,
    loadFolders,
  };
}
