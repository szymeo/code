import * as path from "node:path";
import { isCloudRun, resolveGithubToken } from "../../../utils/common";
import {
  runSignedCommitTool,
  SIGNED_COMMIT_TOOL_DESCRIPTION,
  SIGNED_COMMIT_TOOL_NAME,
  signedCommitToolSchema,
} from "../../signed-commit-shared";
import { defineLocalTool } from "../registry";

/**
 * `git_signed_commit` as a local tool. Cloud-run only; the token is resolved
 * lazily at call time so the tool stays visible even when the GitHub token
 * lands in `process.env` after the session was created (e.g. an orchestrator
 * injecting it post-spawn). Committing is core to cloud tasks, so keep it
 * exposed past ToolSearch via `alwaysLoad`.
 */
export const signedCommitTool = defineLocalTool({
  name: SIGNED_COMMIT_TOOL_NAME,
  description: SIGNED_COMMIT_TOOL_DESCRIPTION,
  schema: signedCommitToolSchema,
  alwaysLoad: true,
  isEnabled: (_ctx, meta) => isCloudRun(meta),
  handler: (ctx, args) => {
    const token = ctx.token ?? resolveGithubToken();
    if (!token) {
      return Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: `${SIGNED_COMMIT_TOOL_NAME} failed: no GitHub token in env (GH_TOKEN/GITHUB_TOKEN)`,
          },
        ],
        isError: true,
      });
    }
    // Resolve an explicit `cwd` arg against the session cwd so the agent can
    // commit from any clone reachable in the sandbox, not just the one the
    // session was rooted at. Absolute paths fall through `path.resolve`
    // unchanged; relative paths join the session cwd.
    const { cwd: argCwd, ...input } = args;
    const cwd = argCwd ? path.resolve(ctx.cwd, argCwd) : ctx.cwd;
    return runSignedCommitTool({ cwd, token, taskId: ctx.taskId }, input);
  },
});
