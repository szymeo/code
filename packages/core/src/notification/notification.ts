import {
  type IMainWindow,
  MAIN_WINDOW_SERVICE,
} from "@posthog/platform/main-window";
import { type INotifier, NOTIFIER_SERVICE } from "@posthog/platform/notifier";
import { inject, injectable, postConstruct } from "inversify";
import { TASK_LINK_SERVICE } from "../links/identifiers";
import { TaskLinkEvent, type TaskLinkService } from "../links/task-link";
import { NOTIFICATION_LOGGER, type NotificationLogger } from "./identifiers";

@injectable()
export class NotificationService {
  private hasBadge = false;

  constructor(
    @inject(TASK_LINK_SERVICE)
    private readonly taskLinkService: TaskLinkService,
    @inject(NOTIFIER_SERVICE)
    private readonly notifier: INotifier,
    @inject(MAIN_WINDOW_SERVICE)
    private readonly mainWindow: IMainWindow,
    @inject(NOTIFICATION_LOGGER)
    private readonly log: NotificationLogger,
  ) {}

  @postConstruct()
  init(): void {
    this.mainWindow.onFocus(() => this.clearDockBadge());
  }

  send(title: string, body: string, silent: boolean, taskId?: string): void {
    if (!this.notifier.isSupported()) {
      this.log.warn("Notifications not supported on this platform");
      return;
    }

    this.notifier.notify({
      title,
      body,
      silent,
      onClick: () => {
        this.log.info("Notification clicked, focusing window", {
          title,
          taskId,
        });
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();

        if (taskId) {
          this.taskLinkService.emit(TaskLinkEvent.OpenTask, { taskId });
          this.log.info("Notification clicked, navigating to task", { taskId });
        }
      },
    });
    this.log.info("Notification sent", { title, body, silent, taskId });
  }

  showDockBadge(): void {
    if (this.hasBadge) return;
    this.hasBadge = true;
    this.notifier.setUnreadIndicator(true);
    this.log.info("Dock badge shown");
  }

  bounceDock(): void {
    this.notifier.requestAttention();
    this.log.info("Dock bounce triggered");
  }

  private clearDockBadge(): void {
    if (!this.hasBadge) return;
    this.hasBadge = false;
    this.notifier.setUnreadIndicator(false);
    this.log.info("Dock badge cleared");
  }
}
