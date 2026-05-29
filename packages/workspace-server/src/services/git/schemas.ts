import { z } from "zod";

export const directoryPathInput = z.object({ directoryPath: z.string() });

export const diffStatsInput = z.object({ directoryPath: z.string().min(1) });

export const diffStatsSchema = z.object({
  filesChanged: z.number().int().nonnegative(),
  linesAdded: z.number().int().nonnegative(),
  linesRemoved: z.number().int().nonnegative(),
});

export type DiffStats = z.infer<typeof diffStatsSchema>;

export const gitFileStatusSchema = z.enum([
  "modified",
  "added",
  "deleted",
  "renamed",
  "untracked",
]);

export const changedFileSchema = z.object({
  path: z.string(),
  status: gitFileStatusSchema,
  originalPath: z.string().optional(),
  linesAdded: z.number().optional(),
  linesRemoved: z.number().optional(),
  staged: z.boolean().optional(),
  patch: z.string().optional(),
});

export type ChangedFile = z.infer<typeof changedFileSchema>;

export const gitCommitInfoSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});

export type GitCommitInfo = z.infer<typeof gitCommitInfoSchema>;

export const gitRepoInfoSchema = z.object({
  organization: z.string(),
  repository: z.string(),
  currentBranch: z.string().nullable(),
  defaultBranch: z.string(),
  compareUrl: z.string().nullable(),
});

export type GitRepoInfo = z.infer<typeof gitRepoInfoSchema>;

export const detectRepoResultSchema = z
  .object({
    organization: z.string(),
    repository: z.string(),
    remote: z.string().optional(),
    branch: z.string().optional(),
  })
  .nullable();

export type DetectRepoResult = z.infer<typeof detectRepoResultSchema>;

export const filePathInput = z.object({
  directoryPath: z.string(),
  filePath: z.string(),
});

export const diffInput = z.object({
  directoryPath: z.string(),
  ignoreWhitespace: z.boolean().optional(),
});

export const stringNullableOutput = z.string().nullable();
export const stringOutput = z.string();
export const stringArrayOutput = z.array(z.string());
export const changedFilesOutput = z.array(changedFileSchema);
export const gitCommitInfoNullableOutput = gitCommitInfoSchema.nullable();
export const gitRepoInfoNullableOutput = gitRepoInfoSchema.nullable();
