import type {
  INotifications,
  NotificationOptions,
} from "@posthog/platform/notifications";
import { trpcClient } from "@renderer/trpc/client";
import { logger } from "@utils/logger";
import { injectable } from "inversify";

const log = logger.scope("notifications-adapter");

@injectable()
export class TrpcNotificationsService implements INotifications {
  notify(options: NotificationOptions): void {
    trpcClient.notification.send.mutate(options).catch((err) => {
      log.error("Failed to send notification", err);
    });
  }

  showUnreadIndicator(): void {
    trpcClient.notification.showDockBadge.mutate().catch((err) => {
      log.error("Failed to show unread indicator", err);
    });
  }

  requestAttention(): void {
    trpcClient.notification.bounceDock.mutate().catch((err) => {
      log.error("Failed to request attention", err);
    });
  }
}
