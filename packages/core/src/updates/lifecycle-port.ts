/**
 * The update-install quit handoff the host must perform when an update is being
 * applied. Distinct from the host-neutral platform IAppLifecycle: these are the
 * "quit specifically to install an update" steps the desktop AppLifecycleService
 * owns. Bound in the host to that service; a web/mobile host implements it as a
 * no-op or its own variant.
 */
export interface UpdateLifecyclePort {
  setQuittingForUpdate(): void;
  clearQuittingForUpdate(): void;
  shutdownWithoutContainer(): Promise<void>;
}

export const UPDATE_LIFECYCLE_PORT = Symbol.for(
  "posthog.core.updateLifecyclePort",
);
