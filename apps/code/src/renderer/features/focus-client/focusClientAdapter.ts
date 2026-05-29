import { invalidateGitBranchQueries } from "@features/git-interaction/utils/gitCacheKeys";
import type { FocusControllerDeps } from "@posthog/core/focus/service";
import {
  setFocusDeps,
  setInvalidateGitBranchQueries,
} from "@posthog/ui/features/focus/focusClient";
import { trpcClient } from "@renderer/trpc/client";

// PORT NOTE: host adapter wiring the main electron-trpc focus/agent/git/workspace
// routes to the core FocusControllerDeps, plus the renderer query-cache
// invalidation, so the UI focus store stays host-agnostic.
const focusDeps: FocusControllerDeps = {
  cancelSessionPrompt: async (sessionId, reason) => {
    await trpcClient.agent.cancelPrompt.mutate({ sessionId, reason });
  },
  checkout: (repoPath, branch) =>
    trpcClient.focus.checkout.mutate({ repoPath, branch }),
  cleanWorkingTree: (repoPath) =>
    trpcClient.focus.cleanWorkingTree.mutate({ repoPath }),
  deleteSession: (mainRepoPath) =>
    trpcClient.focus.deleteSession.mutate({ mainRepoPath }),
  detachWorktree: (worktreePath) =>
    trpcClient.focus.detachWorktree.mutate({ worktreePath }),
  getCommitSha: (repoPath) => trpcClient.focus.getCommitSha.query({ repoPath }),
  getCurrentBranch: async (mainRepoPath) =>
    await trpcClient.git.getCurrentBranch.query({
      directoryPath: mainRepoPath,
    }),
  getSession: (mainRepoPath) =>
    trpcClient.focus.getSession.query({ mainRepoPath }),
  isDirty: (repoPath) => trpcClient.focus.isDirty.query({ repoPath }),
  listLocalTaskIds: async (mainRepoPath) =>
    (await trpcClient.workspace.getLocalTasks.query({ mainRepoPath })).map(
      ({ taskId }) => taskId,
    ),
  listSessionIds: async (taskId) =>
    (await trpcClient.agent.listSessions.query({ taskId })).map(
      ({ taskRunId }) => taskRunId,
    ),
  listWorktreeTaskIds: async (worktreePath) =>
    (await trpcClient.workspace.getWorktreeTasks.query({ worktreePath })).map(
      ({ taskId }) => taskId,
    ),
  notifySessionContext: (sessionId, context) =>
    trpcClient.agent.notifySessionContext.mutate({ sessionId, context }),
  reattachWorktree: (worktreePath, branch) =>
    trpcClient.focus.reattachWorktree.mutate({ worktreePath, branch }),
  saveSession: (session) => trpcClient.focus.saveSession.mutate(session),
  stash: (repoPath, message) =>
    trpcClient.focus.stash.mutate({ repoPath, message }),
  stashApply: (repoPath, stashRef) =>
    trpcClient.focus.stashApply.mutate({ repoPath, stashRef }),
  startSync: (mainRepoPath, worktreePath) =>
    trpcClient.focus.startSync.mutate({ mainRepoPath, worktreePath }),
  startWatchingMainRepo: (mainRepoPath) =>
    trpcClient.focus.startWatchingMainRepo.mutate({ mainRepoPath }),
  stopSync: () => trpcClient.focus.stopSync.mutate(),
  stopWatchingMainRepo: () => trpcClient.focus.stopWatchingMainRepo.mutate(),
  toRelativeWorktreePath: (absolutePath, mainRepoPath) =>
    trpcClient.focus.toRelativeWorktreePath.query({
      absolutePath,
      mainRepoPath,
    }),
  worktreeExistsAtPath: (relativePath) =>
    trpcClient.focus.worktreeExistsAtPath.query({ relativePath }),
};

setFocusDeps(focusDeps);
setInvalidateGitBranchQueries(invalidateGitBranchQueries);
