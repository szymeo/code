import type { FocusControllerDeps } from "@posthog/core/focus/service";

let deps: FocusControllerDeps | null = null;

export function setFocusDeps(impl: FocusControllerDeps): void {
  deps = impl;
}

export function getFocusDeps(): FocusControllerDeps {
  if (!deps) {
    throw new Error("FocusControllerDeps not registered by the host");
  }
  return deps;
}

let invalidateBranches: (mainRepoPath: string) => void = () => {};

export function setInvalidateGitBranchQueries(
  fn: (mainRepoPath: string) => void,
): void {
  invalidateBranches = fn;
}

export function invalidateGitBranchQueries(mainRepoPath: string): void {
  invalidateBranches(mainRepoPath);
}
