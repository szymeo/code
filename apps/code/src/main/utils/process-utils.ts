// PORT NOTE: bridge to @posthog/workspace-server process-tracking host utils.
// Re-exports kill/liveness syscalls now owned by the package. Retire when the
// last apps/code consumer (shell service test mock) imports from the package.
export {
  isProcessAlive,
  killProcessTree,
} from "@posthog/workspace-server/services/process-tracking/process-utils";
