// PORT NOTE: thin host wrapper over the shared ws-server worktree-path deriver,
// supplying the worktree base path from main-process settings. The path logic
// is owned by @posthog/workspace-server/services/worktree-path.
import { deriveWorktreePath as deriveWorktreePathShared } from "@posthog/workspace-server/services/worktree-path/worktree-path";
import { getWorktreeLocation } from "../services/settingsStore";

export function deriveWorktreePath(
  folderPath: string,
  worktreeName: string,
): string {
  return deriveWorktreePathShared(
    getWorktreeLocation(),
    folderPath,
    worktreeName,
  );
}
