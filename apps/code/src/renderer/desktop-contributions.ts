import { authUiModule } from "@posthog/ui/features/auth/auth.module";
import { fileWatcherUiModule } from "@posthog/ui/features/file-watcher/file-watcher.module";
import { notificationsUiModule } from "@posthog/ui/features/notifications/notifications.module";
import { provisioningUiModule } from "@posthog/ui/features/provisioning/provisioning.module";
import { container } from "@renderer/di/container";

export function registerDesktopContributions(): void {
  container.load(
    authUiModule,
    fileWatcherUiModule,
    notificationsUiModule,
    provisioningUiModule,
  );
}
