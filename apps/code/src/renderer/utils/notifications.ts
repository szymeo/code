// PORT NOTE: bridge to @posthog/ui TaskNotificationService. The notification
// gating now lives in that package service (injected settings/view/sound ports
// + NOTIFICATIONS_SERVICE adapter). Delete these free functions when the
// sessions service resolves TaskNotificationService via useService directly.
import { TaskNotificationService } from "@posthog/ui/features/notifications/notifications";
import { container } from "@renderer/di/container";

export function notifyPromptComplete(
  taskTitle: string,
  stopReason: string,
  taskId?: string,
): void {
  container
    .get(TaskNotificationService)
    .notifyPromptComplete(taskTitle, stopReason, taskId);
}

export function notifyPermissionRequest(
  taskTitle: string,
  taskId?: string,
): void {
  container
    .get(TaskNotificationService)
    .notifyPermissionRequest(taskTitle, taskId);
}
