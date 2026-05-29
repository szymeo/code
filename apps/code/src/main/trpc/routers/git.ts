import type { WorkspaceClient } from "@posthog/workspace-client/client";
import { z } from "zod";
import { container } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import {
  checkoutBranchInput,
  checkoutBranchOutput,
  cloneRepositoryInput,
  cloneRepositoryOutput,
  commitInput,
  commitOutput,
  createBranchInput,
  createPrInput,
  createPrOutput,
  detectRepoInput,
  detectRepoOutput,
  diffInput,
  diffOutput,
  discardFileChangesInput,
  discardFileChangesOutput,
  generateCommitMessageInput,
  generateCommitMessageOutput,
  generatePrTitleAndBodyInput,
  generatePrTitleAndBodyOutput,
  getAllBranchesInput,
  getAllBranchesOutput,
  getBranchChangedFilesInput,
  getBranchChangedFilesOutput,
  getChangedFilesHeadInput,
  getChangedFilesHeadOutput,
  getCommitConventionsInput,
  getCommitConventionsOutput,
  getCurrentBranchInput,
  getCurrentBranchOutput,
  getDiffStatsInput,
  getDiffStatsOutput,
  getFileAtHeadInput,
  getFileAtHeadOutput,
  getGitBusyStateInput,
  getGitBusyStateOutput,
  getGithubIssueInput,
  getGithubIssueOutput,
  getGithubPullRequestInput,
  getGithubPullRequestOutput,
  getGitRepoInfoInput,
  getGitRepoInfoOutput,
  getGitSyncStatusOutput,
  getLatestCommitInput,
  getLatestCommitOutput,
  getLocalBranchChangedFilesInput,
  getLocalBranchChangedFilesOutput,
  getPrChangedFilesInput,
  getPrChangedFilesOutput,
  getPrDetailsByUrlInput,
  getPrDetailsByUrlOutput,
  getPrReviewCommentsInput,
  getPrReviewCommentsOutput,
  getPrTemplateInput,
  getPrTemplateOutput,
  getPrUrlForBranchInput,
  getPrUrlForBranchOutput,
  ghAuthTokenOutput,
  ghStatusOutput,
  gitStateSnapshotSchema,
  gitStatusOutput,
  openPrInput,
  openPrOutput,
  prStatusInput,
  prStatusOutput,
  publishInput,
  publishOutput,
  pullInput,
  pullOutput,
  pushInput,
  pushOutput,
  replyToPrCommentInput,
  replyToPrCommentOutput,
  resolveReviewThreadInput,
  resolveReviewThreadOutput,
  searchGithubRefsInput,
  searchGithubRefsOutput,
  stageFilesInput,
  syncInput,
  syncOutput,
  updatePrByUrlInput,
  updatePrByUrlOutput,
  validateRepoInput,
  validateRepoOutput,
} from "../../services/git/schemas";
import { type GitService, GitServiceEvent } from "../../services/git/service";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<GitService>(MAIN_TOKENS.GitService);

// PORT NOTE: git-read bridge. Read-only git ops now execute in
// @posthog/workspace-server (git-read slice); these procedures forward to it
// via workspace-client. GitService keeps the same read methods for in-process
// callers (WorkspaceService/HandoffService). Retire this forwarding when the
// renderer git-interaction consumes workspace-client.git.* directly.
const getWorkspaceClient = () =>
  container.get<WorkspaceClient>(MAIN_TOKENS.WorkspaceClient);

export const gitRouter = router({
  detectRepo: publicProcedure
    .input(detectRepoInput)
    .output(detectRepoOutput)
    .query(({ input }) =>
      getWorkspaceClient().git.detectRepo.query({
        directoryPath: input.directoryPath,
      }),
    ),

  validateRepo: publicProcedure
    .input(validateRepoInput)
    .output(validateRepoOutput)
    .query(({ input }) =>
      getWorkspaceClient().git.validateRepo.query({
        directoryPath: input.directoryPath,
      }),
    ),

  cloneRepository: publicProcedure
    .input(cloneRepositoryInput)
    .output(cloneRepositoryOutput)
    .mutation(({ input }) =>
      getService().cloneRepository(
        input.repoUrl,
        input.targetPath,
        input.cloneId,
      ),
    ),

  onCloneProgress: publicProcedure.subscription(async function* (opts) {
    const service = getService();
    const iterable = service.toIterable(GitServiceEvent.CloneProgress, {
      signal: opts.signal,
    });
    for await (const data of iterable) {
      yield data;
    }
  }),

  // Branch operations
  getCurrentBranch: publicProcedure
    .input(getCurrentBranchInput)
    .output(getCurrentBranchOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getCurrentBranch.query(
        { directoryPath: input.directoryPath },
        { signal },
      ),
    ),

  getAllBranches: publicProcedure
    .input(getAllBranchesInput)
    .output(getAllBranchesOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getAllBranches.query(
        { directoryPath: input.directoryPath },
        { signal },
      ),
    ),

  getGitBusyState: publicProcedure
    .input(getGitBusyStateInput)
    .output(getGitBusyStateOutput)
    .query(({ input, signal }) =>
      getService().getGitBusyState(input.directoryPath, signal),
    ),

  createBranch: publicProcedure
    .input(createBranchInput)
    .mutation(({ input }) =>
      getService().createBranch(input.directoryPath, input.branchName),
    ),

  checkoutBranch: publicProcedure
    .input(checkoutBranchInput)
    .output(checkoutBranchOutput)
    .mutation(({ input }) =>
      getService().checkoutBranch(input.directoryPath, input.branchName),
    ),

  // File change operations
  getChangedFilesHead: publicProcedure
    .input(getChangedFilesHeadInput)
    .output(getChangedFilesHeadOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getChangedFilesHead.query(
        { directoryPath: input.directoryPath },
        { signal },
      ),
    ),

  getFileAtHead: publicProcedure
    .input(getFileAtHeadInput)
    .output(getFileAtHeadOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getFileAtHead.query(
        { directoryPath: input.directoryPath, filePath: input.filePath },
        { signal },
      ),
    ),

  getDiffHead: publicProcedure
    .input(diffInput)
    .output(diffOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getDiffHead.query(
        {
          directoryPath: input.directoryPath,
          ignoreWhitespace: input.ignoreWhitespace,
        },
        { signal },
      ),
    ),

  getDiffCached: publicProcedure
    .input(diffInput)
    .output(diffOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getDiffCached.query(
        {
          directoryPath: input.directoryPath,
          ignoreWhitespace: input.ignoreWhitespace,
        },
        { signal },
      ),
    ),

  getDiffUnstaged: publicProcedure
    .input(diffInput)
    .output(diffOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getDiffUnstaged.query(
        {
          directoryPath: input.directoryPath,
          ignoreWhitespace: input.ignoreWhitespace,
        },
        { signal },
      ),
    ),

  getDiffStats: publicProcedure
    .input(getDiffStatsInput)
    .output(getDiffStatsOutput)
    .query(({ input, signal }) =>
      getService().getDiffStats(input.directoryPath, signal),
    ),

  stageFiles: publicProcedure
    .input(stageFilesInput)
    .output(gitStateSnapshotSchema)
    .mutation(({ input }) =>
      getService().stageFiles(input.directoryPath, input.paths),
    ),

  unstageFiles: publicProcedure
    .input(stageFilesInput)
    .output(gitStateSnapshotSchema)
    .mutation(({ input }) =>
      getService().unstageFiles(input.directoryPath, input.paths),
    ),

  discardFileChanges: publicProcedure
    .input(discardFileChangesInput)
    .output(discardFileChangesOutput)
    .mutation(({ input }) =>
      getService().discardFileChanges(
        input.directoryPath,
        input.filePath,
        input.fileStatus,
      ),
    ),

  // Sync status operations
  getGitSyncStatus: publicProcedure
    .input(
      z.object({
        directoryPath: z.string(),
        forceRefresh: z.boolean().optional(),
      }),
    )
    .output(getGitSyncStatusOutput)
    .query(({ input }) =>
      getService().getGitSyncStatus(input.directoryPath, input.forceRefresh),
    ),

  // Commit/repo info operations
  getLatestCommit: publicProcedure
    .input(getLatestCommitInput)
    .output(getLatestCommitOutput)
    .query(({ input, signal }) =>
      getWorkspaceClient().git.getLatestCommit.query(
        { directoryPath: input.directoryPath },
        { signal },
      ),
    ),

  getGitRepoInfo: publicProcedure
    .input(getGitRepoInfoInput)
    .output(getGitRepoInfoOutput)
    .query(({ input }) =>
      getWorkspaceClient().git.getGitRepoInfo.query({
        directoryPath: input.directoryPath,
      }),
    ),

  commit: publicProcedure
    .input(commitInput)
    .output(commitOutput)
    .mutation(({ input }) =>
      getService().commit(input.directoryPath, input.message, {
        paths: input.paths,
        allowEmpty: input.allowEmpty,
        stagedOnly: input.stagedOnly,
        taskId: input.taskId,
      }),
    ),

  push: publicProcedure
    .input(pushInput)
    .output(pushOutput)
    .mutation(({ input, signal }) =>
      getService().push(
        input.directoryPath,
        input.remote,
        input.branch,
        input.setUpstream,
        signal,
      ),
    ),

  pull: publicProcedure
    .input(pullInput)
    .output(pullOutput)
    .mutation(({ input, signal }) =>
      getService().pull(
        input.directoryPath,
        input.remote,
        input.branch,
        signal,
      ),
    ),

  publish: publicProcedure
    .input(publishInput)
    .output(publishOutput)
    .mutation(({ input, signal }) =>
      getService().publish(input.directoryPath, input.remote, signal),
    ),

  sync: publicProcedure
    .input(syncInput)
    .output(syncOutput)
    .mutation(({ input, signal }) =>
      getService().sync(input.directoryPath, input.remote, signal),
    ),

  getGitStatus: publicProcedure
    .output(gitStatusOutput)
    .query(() => getService().getGitStatus()),

  getGhStatus: publicProcedure
    .output(ghStatusOutput)
    .query(() => getService().getGhStatus()),

  getGhAuthToken: publicProcedure
    .output(ghAuthTokenOutput)
    .query(() => getService().getGhAuthToken()),

  getPrStatus: publicProcedure
    .input(prStatusInput)
    .output(prStatusOutput)
    .query(({ input }) => getService().getPrStatus(input.directoryPath)),

  getPrUrlForBranch: publicProcedure
    .input(getPrUrlForBranchInput)
    .output(getPrUrlForBranchOutput)
    .query(({ input }) =>
      getService().getPrUrlForBranch(input.directoryPath, input.branchName),
    ),

  createPr: publicProcedure
    .input(createPrInput)
    .output(createPrOutput)
    .mutation(({ input }) => getService().createPr(input)),

  openPr: publicProcedure
    .input(openPrInput)
    .output(openPrOutput)
    .mutation(({ input }) => getService().openPr(input.directoryPath)),

  getPrTemplate: publicProcedure
    .input(getPrTemplateInput)
    .output(getPrTemplateOutput)
    .query(({ input }) => getService().getPrTemplate(input.directoryPath)),

  getCommitConventions: publicProcedure
    .input(getCommitConventionsInput)
    .output(getCommitConventionsOutput)
    .query(({ input }) =>
      getService().getCommitConventions(input.directoryPath, input.sampleSize),
    ),

  getPrChangedFiles: publicProcedure
    .input(getPrChangedFilesInput)
    .output(getPrChangedFilesOutput)
    .query(({ input }) => getService().getPrChangedFiles(input.prUrl)),

  getPrDetailsByUrl: publicProcedure
    .input(getPrDetailsByUrlInput)
    .output(getPrDetailsByUrlOutput)
    .query(async ({ input }) => {
      const result = await getService().getPrDetailsByUrl(input.prUrl);
      return result ?? { state: "unknown", merged: false, draft: false };
    }),

  updatePrByUrl: publicProcedure
    .input(updatePrByUrlInput)
    .output(updatePrByUrlOutput)
    .mutation(({ input }) =>
      getService().updatePrByUrl(input.prUrl, input.action),
    ),

  getPrReviewComments: publicProcedure
    .input(getPrReviewCommentsInput)
    .output(getPrReviewCommentsOutput)
    .query(({ input }) => getService().getPrReviewComments(input.prUrl)),

  replyToPrComment: publicProcedure
    .input(replyToPrCommentInput)
    .output(replyToPrCommentOutput)
    .mutation(({ input }) =>
      getService().replyToPrComment(input.prUrl, input.commentId, input.body),
    ),

  resolveReviewThread: publicProcedure
    .input(resolveReviewThreadInput)
    .output(resolveReviewThreadOutput)
    .mutation(({ input }) =>
      getService().resolveReviewThread(input.threadNodeId, input.resolved),
    ),

  getBranchChangedFiles: publicProcedure
    .input(getBranchChangedFilesInput)
    .output(getBranchChangedFilesOutput)
    .query(({ input }) =>
      getService().getBranchChangedFiles(input.repo, input.branch),
    ),

  getLocalBranchChangedFiles: publicProcedure
    .input(getLocalBranchChangedFilesInput)
    .output(getLocalBranchChangedFilesOutput)
    .query(({ input }) =>
      getService().getLocalBranchChangedFiles(
        input.directoryPath,
        input.branch,
      ),
    ),

  generateCommitMessage: publicProcedure
    .input(generateCommitMessageInput)
    .output(generateCommitMessageOutput)
    .mutation(({ input }) =>
      getService().generateCommitMessage(
        input.directoryPath,
        input.conversationContext,
      ),
    ),

  generatePrTitleAndBody: publicProcedure
    .input(generatePrTitleAndBodyInput)
    .output(generatePrTitleAndBodyOutput)
    .mutation(({ input }) =>
      getService().generatePrTitleAndBody(
        input.directoryPath,
        input.conversationContext,
      ),
    ),

  searchGithubRefs: publicProcedure
    .input(searchGithubRefsInput)
    .output(searchGithubRefsOutput)
    .query(({ input }) =>
      getService().searchGithubRefs(
        input.directoryPath,
        input.query,
        input.limit,
        input.kinds,
      ),
    ),

  getGithubIssue: publicProcedure
    .input(getGithubIssueInput)
    .output(getGithubIssueOutput)
    .query(({ input }) =>
      getService().getGithubIssue(input.owner, input.repo, input.number),
    ),

  getGithubPullRequest: publicProcedure
    .input(getGithubPullRequestInput)
    .output(getGithubPullRequestOutput)
    .query(({ input }) =>
      getService().getGithubPullRequest(input.owner, input.repo, input.number),
    ),

  onCreatePrProgress: publicProcedure.subscription(async function* (opts) {
    const service = getService();
    const iterable = service.toIterable(GitServiceEvent.CreatePrProgress, {
      signal: opts.signal,
    });
    for await (const data of iterable) {
      yield data;
    }
  }),
});
