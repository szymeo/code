import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { container } from "./di/container";
import { TOKENS } from "./di/tokens";
import { connectivityStatusOutput } from "./services/connectivity/schemas";
import type { ConnectivityService } from "./services/connectivity/service";
import {
  createEnvironmentInput,
  deleteEnvironmentInput,
  environmentSchema,
  getEnvironmentInput,
  listEnvironmentsInput,
  updateEnvironmentInput,
} from "./services/environment/schemas";
import type { EnvironmentService } from "./services/environment/service";
import {
  checkoutInput,
  findWorktreeInput,
  focusResultSchema,
  focusSessionSchema,
  mainRepoPathInput,
  reattachInput,
  repoPathInput,
  stashInput,
  stashResultSchema,
  syncInput,
  worktreeInput,
} from "./services/focus/schemas";
import type { FocusService } from "./services/focus/service";
import type { FocusSyncService } from "./services/focus/sync-service";
import {
  boundedReadResult,
  listDirectoryInput,
  listDirectoryOutput,
  listRepoFilesInput,
  listRepoFilesOutput,
  readAbsoluteFileInput,
  readRepoFileBoundedInput,
  readRepoFileInput,
  readRepoFileOutput,
  readRepoFilesBoundedInput,
  readRepoFilesBoundedOutput,
  readRepoFilesInput,
  readRepoFilesOutput,
  writeRepoFileInput,
} from "./services/fs/schemas";
import type { FsService } from "./services/fs/service";
import {
  changedFilesOutput,
  detectRepoResultSchema,
  diffInput,
  diffStatsInput,
  diffStatsSchema,
  directoryPathInput,
  filePathInput,
  gitCommitInfoNullableOutput,
  gitRepoInfoNullableOutput,
  stringArrayOutput,
  stringNullableOutput,
  stringOutput,
} from "./services/git/schemas";
import type { GitService } from "./services/git/service";
import {
  readLocalLogsInput,
  readLocalLogsOutput,
  writeLocalLogsInput,
} from "./services/local-logs/schemas";
import type { LocalLogsService } from "./services/local-logs/service";
import {
  resolveGitDirsInput,
  resolveGitDirsOutput,
  watchInput,
  watchRepoInput,
} from "./services/watcher/schemas";
import type { WatcherService } from "./services/watcher/service";

const t = initTRPC.create({ transformer: superjson });

const focusService = () => container.get<FocusService>(TOKENS.FocusService);
const focusSyncService = () =>
  container.get<FocusSyncService>(TOKENS.FocusSyncService);
const gitService = () => container.get<GitService>(TOKENS.GitService);
const fsService = () => container.get<FsService>(TOKENS.FsService);
const watcherService = () =>
  container.get<WatcherService>(TOKENS.WatcherService);
const localLogsService = () =>
  container.get<LocalLogsService>(TOKENS.LocalLogsService);
const connectivityService = () =>
  container.get<ConnectivityService>(TOKENS.ConnectivityService);
const environmentService = () =>
  container.get<EnvironmentService>(TOKENS.EnvironmentService);

export {
  type FocusBranchRenamedEvent,
  type FocusForeignBranchCheckoutEvent,
  type FocusResult,
  type FocusSession,
  focusBranchRenamedEventSchema,
  focusForeignBranchCheckoutEventSchema,
  focusResultSchema,
  focusSessionSchema,
  type StashResult,
  stashResultSchema,
} from "./services/focus/schemas";
export { type DiffStats, diffStatsSchema } from "./services/git/schemas";
export {
  type FileWatcherEvent,
  FileWatcherEventKind,
} from "./services/watcher/schemas";

export const appRouter = t.router({
  focus: t.router({
    getSession: t.procedure
      .input(mainRepoPathInput)
      .output(focusSessionSchema.nullable())
      .query(({ input }) => focusService().getSession(input.mainRepoPath)),

    saveSession: t.procedure
      .input(focusSessionSchema)
      .mutation(({ input }) => focusService().saveSession(input)),

    deleteSession: t.procedure
      .input(mainRepoPathInput)
      .mutation(({ input }) =>
        focusService().deleteSession(input.mainRepoPath),
      ),

    isFocusActive: t.procedure
      .input(mainRepoPathInput)
      .output(z.boolean())
      .query(({ input }) => focusService().isFocusActive(input.mainRepoPath)),

    isDirty: t.procedure
      .input(repoPathInput)
      .output(z.boolean())
      .query(({ input }) => focusService().isDirty(input.repoPath)),

    getCommitSha: t.procedure
      .input(repoPathInput)
      .output(z.string())
      .query(({ input }) => focusService().getCommitSha(input.repoPath)),

    findWorktreeByBranch: t.procedure
      .input(findWorktreeInput)
      .output(z.string().nullable())
      .query(({ input }) =>
        focusService().findWorktreeByBranch(input.mainRepoPath, input.branch),
      ),

    stash: t.procedure
      .input(stashInput)
      .output(stashResultSchema)
      .mutation(({ input }) =>
        focusService().stash(input.repoPath, input.message),
      ),

    stashPop: t.procedure
      .input(repoPathInput)
      .output(focusResultSchema)
      .mutation(({ input }) => focusService().stashPop(input.repoPath)),

    stashApply: t.procedure
      .input(z.object({ repoPath: z.string(), stashRef: z.string() }))
      .output(focusResultSchema)
      .mutation(({ input }) =>
        focusService().stashApply(input.repoPath, input.stashRef),
      ),

    checkout: t.procedure
      .input(checkoutInput)
      .output(focusResultSchema)
      .mutation(({ input }) =>
        focusService().checkout(input.repoPath, input.branch),
      ),

    detachWorktree: t.procedure
      .input(worktreeInput)
      .output(focusResultSchema)
      .mutation(({ input }) =>
        focusService().detachWorktree(input.worktreePath),
      ),

    reattachWorktree: t.procedure
      .input(reattachInput)
      .output(focusResultSchema)
      .mutation(({ input }) =>
        focusService().reattachWorktree(input.worktreePath, input.branch),
      ),

    cleanWorkingTree: t.procedure
      .input(repoPathInput)
      .mutation(({ input }) => focusService().cleanWorkingTree(input.repoPath)),

    startSync: t.procedure
      .input(syncInput)
      .mutation(({ input }) =>
        focusSyncService().startSync(input.mainRepoPath, input.worktreePath),
      ),

    stopSync: t.procedure.mutation(() => focusSyncService().stopSync()),

    startWatchingMainRepo: t.procedure
      .input(mainRepoPathInput)
      .mutation(({ input }) =>
        focusService().startWatchingMainRepo(input.mainRepoPath),
      ),

    stopWatchingMainRepo: t.procedure.mutation(() =>
      focusService().stopWatchingMainRepo(),
    ),

    onBranchRenamed: t.procedure.subscription(async function* (opts) {
      for await (const event of focusService().branchRenamedEvents(
        opts.signal,
      )) {
        yield event;
      }
    }),

    onForeignBranchCheckout: t.procedure.subscription(async function* (opts) {
      for await (const event of focusService().foreignBranchCheckoutEvents(
        opts.signal,
      )) {
        yield event;
      }
    }),
  }),
  git: t.router({
    detectRepo: t.procedure
      .input(directoryPathInput)
      .output(detectRepoResultSchema)
      .query(({ input }) => gitService().detectRepo(input.directoryPath)),

    validateRepo: t.procedure
      .input(directoryPathInput)
      .output(z.boolean())
      .query(({ input }) => gitService().validateRepo(input.directoryPath)),

    getRemoteUrl: t.procedure
      .input(directoryPathInput)
      .output(stringNullableOutput)
      .query(({ input }) => gitService().getRemoteUrl(input.directoryPath)),

    getCurrentBranch: t.procedure
      .input(directoryPathInput)
      .output(stringNullableOutput)
      .query(({ input, signal }) =>
        gitService().getCurrentBranch(input.directoryPath, signal),
      ),

    getDefaultBranch: t.procedure
      .input(directoryPathInput)
      .output(stringOutput)
      .query(({ input }) => gitService().getDefaultBranch(input.directoryPath)),

    getAllBranches: t.procedure
      .input(directoryPathInput)
      .output(stringArrayOutput)
      .query(({ input, signal }) =>
        gitService().getAllBranches(input.directoryPath, signal),
      ),

    getChangedFilesHead: t.procedure
      .input(directoryPathInput)
      .output(changedFilesOutput)
      .query(({ input, signal }) =>
        gitService().getChangedFilesHead(input.directoryPath, signal),
      ),

    getFileAtHead: t.procedure
      .input(filePathInput)
      .output(stringNullableOutput)
      .query(({ input, signal }) =>
        gitService().getFileAtHead(input.directoryPath, input.filePath, signal),
      ),

    getDiffHead: t.procedure
      .input(diffInput)
      .output(stringOutput)
      .query(({ input, signal }) =>
        gitService().getDiffHead(
          input.directoryPath,
          input.ignoreWhitespace,
          signal,
        ),
      ),

    getDiffCached: t.procedure
      .input(diffInput)
      .output(stringOutput)
      .query(({ input, signal }) =>
        gitService().getDiffCached(
          input.directoryPath,
          input.ignoreWhitespace,
          signal,
        ),
      ),

    getDiffUnstaged: t.procedure
      .input(diffInput)
      .output(stringOutput)
      .query(({ input, signal }) =>
        gitService().getDiffUnstaged(
          input.directoryPath,
          input.ignoreWhitespace,
          signal,
        ),
      ),

    getLatestCommit: t.procedure
      .input(directoryPathInput)
      .output(gitCommitInfoNullableOutput)
      .query(({ input, signal }) =>
        gitService().getLatestCommit(input.directoryPath, signal),
      ),

    getGitRepoInfo: t.procedure
      .input(directoryPathInput)
      .output(gitRepoInfoNullableOutput)
      .query(({ input }) => gitService().getGitRepoInfo(input.directoryPath)),
  }),
  diffStats: t.router({
    getDiffStats: t.procedure
      .input(diffStatsInput)
      .output(diffStatsSchema)
      .query(({ input }) => gitService().getDiffStats(input.directoryPath)),
  }),
  fs: t.router({
    listDirectory: t.procedure
      .input(listDirectoryInput)
      .output(listDirectoryOutput)
      .query(({ input }) => fsService().listDirectory(input.dirPath)),

    listRepoFiles: t.procedure
      .input(listRepoFilesInput)
      .output(listRepoFilesOutput)
      .query(({ input }) =>
        fsService().listRepoFiles(input.repoPath, input.query, input.limit),
      ),

    readRepoFile: t.procedure
      .input(readRepoFileInput)
      .output(readRepoFileOutput)
      .query(({ input }) =>
        fsService().readRepoFile(input.repoPath, input.filePath),
      ),

    readRepoFiles: t.procedure
      .input(readRepoFilesInput)
      .output(readRepoFilesOutput)
      .query(({ input }) =>
        fsService().readRepoFiles(input.repoPath, input.filePaths),
      ),

    readRepoFileBounded: t.procedure
      .input(readRepoFileBoundedInput)
      .output(boundedReadResult)
      .query(({ input }) =>
        fsService().readRepoFileBounded(
          input.repoPath,
          input.filePath,
          input.maxLines,
        ),
      ),

    readRepoFilesBounded: t.procedure
      .input(readRepoFilesBoundedInput)
      .output(readRepoFilesBoundedOutput)
      .query(({ input }) =>
        fsService().readRepoFilesBounded(
          input.repoPath,
          input.filePaths,
          input.maxLines,
        ),
      ),

    readAbsoluteFile: t.procedure
      .input(readAbsoluteFileInput)
      .output(readRepoFileOutput)
      .query(({ input }) => fsService().readAbsoluteFile(input.filePath)),

    readFileAsBase64: t.procedure
      .input(readAbsoluteFileInput)
      .output(readRepoFileOutput)
      .query(({ input }) => fsService().readFileAsBase64(input.filePath)),

    writeRepoFile: t.procedure
      .input(writeRepoFileInput)
      .mutation(({ input }) =>
        fsService().writeRepoFile(
          input.repoPath,
          input.filePath,
          input.content,
        ),
      ),
  }),
  watcher: t.router({
    resolveGitDirs: t.procedure
      .input(resolveGitDirsInput)
      .output(resolveGitDirsOutput)
      .query(({ input }) => watcherService().resolveGitDirs(input.repoPath)),

    watch: t.procedure
      .input(watchInput)
      .subscription(({ input, signal }) =>
        watcherService().watch(input.dirPath, { ignore: input.ignore }, signal),
      ),
  }),
  fileWatcher: t.router({
    watch: t.procedure
      .input(watchRepoInput)
      .subscription(({ input, signal }) =>
        watcherService().watchRepo(input.repoPath, signal),
      ),
  }),
  localLogs: t.router({
    read: t.procedure
      .input(readLocalLogsInput)
      .output(readLocalLogsOutput)
      .query(({ input }) => localLogsService().readLocalLogs(input.taskRunId)),

    write: t.procedure
      .input(writeLocalLogsInput)
      .mutation(({ input }) =>
        localLogsService().writeLocalLogs(input.taskRunId, input.content),
      ),
  }),
  connectivity: t.router({
    getStatus: t.procedure
      .output(connectivityStatusOutput)
      .query(() => connectivityService().getStatus()),

    checkNow: t.procedure
      .output(connectivityStatusOutput)
      .mutation(() => connectivityService().checkNow()),

    onStatusChange: t.procedure.subscription(async function* (opts) {
      for await (const status of connectivityService().statusChangeEvents(
        opts.signal,
      )) {
        yield status;
      }
    }),
  }),
  environment: t.router({
    list: t.procedure
      .input(listEnvironmentsInput)
      .output(environmentSchema.array())
      .query(({ input }) =>
        environmentService().listEnvironments(input.repoPath),
      ),

    get: t.procedure
      .input(getEnvironmentInput)
      .output(environmentSchema.nullable())
      .query(({ input }) =>
        environmentService().getEnvironment(input.repoPath, input.id),
      ),

    create: t.procedure
      .input(createEnvironmentInput)
      .output(environmentSchema)
      .mutation(({ input }) => {
        const { repoPath, ...rest } = input;
        return environmentService().createEnvironment(rest, repoPath);
      }),

    update: t.procedure
      .input(updateEnvironmentInput)
      .output(environmentSchema)
      .mutation(({ input }) => {
        const { repoPath, ...rest } = input;
        return environmentService().updateEnvironment(rest, repoPath);
      }),

    delete: t.procedure
      .input(deleteEnvironmentInput)
      .mutation(({ input }) =>
        environmentService().deleteEnvironment(input.repoPath, input.id),
      ),
  }),
});

export type AppRouter = typeof appRouter;
