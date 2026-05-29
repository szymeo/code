// Desktop host service bindings live here as features move into packages.
// Importing the renderer container performs today's existing bindings.
import "@renderer/di/container";
import {
  type CompletionSound,
  useSettingsStore,
} from "@posthog/ui/features/settings/settingsStore";
import { WORKBENCH_LOGGER, type WorkbenchLogger } from "@posthog/di/logger";
import { NOTIFICATIONS_SERVICE } from "@posthog/platform/notifications";
import {
  ACTIVE_VIEW_PORT,
  type ActiveViewPort,
  COMPLETION_SOUND_PORT,
  type CompletionSoundPort,
  NOTIFICATION_SETTINGS_PORT,
  type NotificationSettingsPort,
} from "@posthog/ui/features/notifications/ports";
import {
  PROVISIONING_OUTPUT_PORT,
  type ProvisioningOutputPort,
} from "@posthog/ui/features/provisioning/ports";
import {
  AUTH_CLIENT,
  AUTH_SIDE_EFFECTS,
  type AuthClient,
  type AuthSideEffects,
} from "@posthog/ui/features/auth/ports";
import {
  setPosthogApiClientAppVersion,
  setPosthogApiClientLogger,
} from "@posthog/api-client/posthog-client";
import {
  FOLDERS_CLIENT,
  type FoldersClient,
} from "@posthog/ui/features/folders/ports";
import { configureBilling } from "@posthog/ui/features/billing/ports";
import {
  FEATURE_FLAGS,
  type FeatureFlags,
} from "@posthog/ui/features/feature-flags/ports";
import { RendererBillingClient } from "@renderer/platform-adapters/billing-client";
import {
  REPO_FILES_CLIENT,
  type RepoFilesClient,
} from "@posthog/ui/features/repo-files/ports";
import { container } from "@renderer/di/container";
import { RendererFeatureFlags } from "@renderer/platform-adapters/feature-flags";
import { TrpcAuthClient } from "@renderer/platform-adapters/auth-client";
import { TrpcFoldersClient } from "@renderer/platform-adapters/folders-client";
import { TrpcRepoFilesClient } from "@renderer/platform-adapters/repo-files-client";
import { RendererAuthSideEffects } from "@renderer/platform-adapters/auth-side-effects";
import { TrpcNotificationsService } from "@renderer/platform-adapters/notifications";
import { TrpcProvisioningOutputService } from "@renderer/platform-adapters/provisioning";
import { useNavigationStore } from "@stores/navigationStore";
import { logger } from "@utils/logger";
import { playCompletionSound } from "@utils/sounds";

configureBilling(new RendererBillingClient(), logger.scope("seat-store"));
setPosthogApiClientLogger(logger.scope("posthog-client"));
setPosthogApiClientAppVersion(
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown",
);

container
  .bind<WorkbenchLogger>(WORKBENCH_LOGGER)
  .toConstantValue(logger.scope("workbench"));

container
  .bind(NOTIFICATIONS_SERVICE)
  .to(TrpcNotificationsService)
  .inSingletonScope();

container
  .bind<NotificationSettingsPort>(NOTIFICATION_SETTINGS_PORT)
  .toConstantValue({
    get: () => {
      const s = useSettingsStore.getState();
      return {
        desktopNotifications: s.desktopNotifications,
        dockBadgeNotifications: s.dockBadgeNotifications,
        dockBounceNotifications: s.dockBounceNotifications,
        completionSound: s.completionSound,
        completionVolume: s.completionVolume,
      };
    },
  });

container.bind<ActiveViewPort>(ACTIVE_VIEW_PORT).toConstantValue({
  hasFocus: () => document.hasFocus(),
  getActiveTaskId: () => {
    const { view } = useNavigationStore.getState();
    return view.type === "task-detail"
      ? (view.data?.id ?? view.taskId)
      : undefined;
  },
});

container.bind<CompletionSoundPort>(COMPLETION_SOUND_PORT).toConstantValue({
  play: (sound, volume) =>
    playCompletionSound(sound as CompletionSound, volume),
});

container
  .bind<ProvisioningOutputPort>(PROVISIONING_OUTPUT_PORT)
  .to(TrpcProvisioningOutputService)
  .inSingletonScope();

container.bind<AuthClient>(AUTH_CLIENT).to(TrpcAuthClient).inSingletonScope();

container
  .bind<FoldersClient>(FOLDERS_CLIENT)
  .to(TrpcFoldersClient)
  .inSingletonScope();

container
  .bind<RepoFilesClient>(REPO_FILES_CLIENT)
  .to(TrpcRepoFilesClient)
  .inSingletonScope();

container
  .bind<FeatureFlags>(FEATURE_FLAGS)
  .to(RendererFeatureFlags)
  .inSingletonScope();

container
  .bind<AuthSideEffects>(AUTH_SIDE_EFFECTS)
  .to(RendererAuthSideEffects)
  .inSingletonScope();
