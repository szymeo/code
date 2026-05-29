export interface NotificationLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export const NOTIFICATION_SERVICE = Symbol.for(
  "posthog.core.notificationService",
);

export const NOTIFICATION_LOGGER = Symbol.for(
  "posthog.core.notificationLogger",
);
