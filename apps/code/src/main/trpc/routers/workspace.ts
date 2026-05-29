import { WORKSPACE_METADATA_SERVICE } from "@posthog/workspace-server/services/workspace-metadata/identifiers";
import type { WorkspaceMetadataService } from "@posthog/workspace-server/services/workspace-metadata/workspace-metadata";
import {
  getWorktreeFileUsage,
  getWorktreeSize,
} from "@posthog/workspace-server/services/worktree-query/worktree-query";
import { container } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import type { GitService } from "../../services/git/service";
import {
  createWorkspaceInput,
  createWorkspaceOutput,
  deleteWorkspaceInput,
  deleteWorktreeInput,
  getAllTaskTimestampsOutput,
  getAllWorkspacesOutput,
  getLocalTasksInput,
  getLocalTasksOutput,
  getPinnedTaskIdsOutput,
  getTaskTimestampsInput,
  getTaskTimestampsOutput,
  getWorkspaceInfoInput,
  getWorkspaceInfoOutput,
  getWorktreeFileUsageInput,
  getWorktreeFileUsageOutput,
  getWorktreeSizeInput,
  getWorktreeSizeOutput,
  getWorktreeTasksInput,
  getWorktreeTasksOutput,
  linkBranchInput,
  listGitWorktreesInput,
  listGitWorktreesOutput,
  markActivityInput,
  markViewedInput,
  reconcileCloudWorkspacesInput,
  reconcileCloudWorkspacesOutput,
  taskPrStatusInput,
  taskPrStatusOutput,
  togglePinInput,
  togglePinOutput,
  unlinkBranchInput,
  verifyWorkspaceInput,
  verifyWorkspaceOutput,
} from "../../services/workspace/schemas";
import {
  type WorkspaceService,
  WorkspaceServiceEvent,
  type WorkspaceServiceEvents,
} from "../../services/workspace/service";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<WorkspaceService>(MAIN_TOKENS.WorkspaceService);

const getGitService = () => container.get<GitService>(MAIN_TOKENS.GitService);

const getMetadata = () =>
  container.get<WorkspaceMetadataService>(WORKSPACE_METADATA_SERVICE);

function subscribe<K extends keyof WorkspaceServiceEvents>(event: K) {
  return publicProcedure.subscription(async function* (opts) {
    const service = getService();
    const iterable = service.toIterable(event, { signal: opts.signal });
    for await (const data of iterable) {
      yield data;
    }
  });
}

export const workspaceRouter = router({
  create: publicProcedure
    .input(createWorkspaceInput)
    .output(createWorkspaceOutput)
    .mutation(({ input }) => getService().createWorkspace(input)),

  reconcileCloudWorkspaces: publicProcedure
    .input(reconcileCloudWorkspacesInput)
    .output(reconcileCloudWorkspacesOutput)
    .mutation(({ input }) =>
      getService().reconcileCloudWorkspaces(input.taskIds),
    ),

  delete: publicProcedure
    .input(deleteWorkspaceInput)
    .mutation(({ input }) =>
      getService().deleteWorkspace(input.taskId, input.mainRepoPath),
    ),

  verify: publicProcedure
    .input(verifyWorkspaceInput)
    .output(verifyWorkspaceOutput)
    .query(({ input }) => getService().verifyWorkspaceExists(input.taskId)),

  getInfo: publicProcedure
    .input(getWorkspaceInfoInput)
    .output(getWorkspaceInfoOutput)
    .query(({ input }) => getService().getWorkspaceInfo(input.taskId)),

  getAll: publicProcedure
    .output(getAllWorkspacesOutput)
    .query(() => getService().getAllWorkspaces()),

  getLocalTasks: publicProcedure
    .input(getLocalTasksInput)
    .output(getLocalTasksOutput)
    .query(({ input }) =>
      getService().getLocalTasksForFolder(input.mainRepoPath),
    ),

  getWorktreeTasks: publicProcedure
    .input(getWorktreeTasksInput)
    .output(getWorktreeTasksOutput)
    .query(({ input }) => getService().getWorktreeTasks(input.worktreePath)),

  listGitWorktrees: publicProcedure
    .input(listGitWorktreesInput)
    .output(listGitWorktreesOutput)
    .query(({ input }) => getService().listGitWorktrees(input.mainRepoPath)),

  getWorktreeSize: publicProcedure
    .input(getWorktreeSizeInput)
    .output(getWorktreeSizeOutput)
    .query(({ input }) => getWorktreeSize(input.worktreePath)),

  getWorktreeFileUsage: publicProcedure
    .input(getWorktreeFileUsageInput)
    .output(getWorktreeFileUsageOutput)
    .query(({ input }) => getWorktreeFileUsage(input.mainRepoPath)),

  deleteWorktree: publicProcedure
    .input(deleteWorktreeInput)
    .mutation(({ input }) =>
      getService().deleteWorktree(input.mainRepoPath, input.worktreePath),
    ),

  togglePin: publicProcedure
    .input(togglePinInput)
    .output(togglePinOutput)
    .mutation(({ input }) => getMetadata().togglePin(input.taskId)),

  markViewed: publicProcedure
    .input(markViewedInput)
    .mutation(({ input }) => getMetadata().markViewed(input.taskId)),

  markActivity: publicProcedure
    .input(markActivityInput)
    .mutation(({ input }) => getMetadata().markActivity(input.taskId)),

  getPinnedTaskIds: publicProcedure
    .output(getPinnedTaskIdsOutput)
    .query(() => getMetadata().getPinnedTaskIds()),

  getTaskTimestamps: publicProcedure
    .input(getTaskTimestampsInput)
    .output(getTaskTimestampsOutput)
    .query(({ input }) => getMetadata().getTaskTimestamps(input.taskId)),

  getAllTaskTimestamps: publicProcedure
    .output(getAllTaskTimestampsOutput)
    .query(() => getMetadata().getAllTaskTimestamps()),

  linkBranch: publicProcedure
    .input(linkBranchInput)
    .mutation(({ input }) =>
      getService().linkBranch(input.taskId, input.branchName, "user"),
    ),

  unlinkBranch: publicProcedure
    .input(unlinkBranchInput)
    .mutation(({ input }) => getService().unlinkBranch(input.taskId, "user")),

  getTaskPrStatus: publicProcedure
    .input(taskPrStatusInput)
    .output(taskPrStatusOutput)
    .query(({ input }) =>
      getGitService().getTaskPrStatus(input.taskId, input.cloudPrUrl),
    ),

  onError: subscribe(WorkspaceServiceEvent.Error),
  onWarning: subscribe(WorkspaceServiceEvent.Warning),
  onPromoted: subscribe(WorkspaceServiceEvent.Promoted),
  onBranchChanged: subscribe(WorkspaceServiceEvent.BranchChanged),
  onLinkedBranchChanged: subscribe(WorkspaceServiceEvent.LinkedBranchChanged),
});
