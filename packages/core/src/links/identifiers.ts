export interface LinkLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export const TASK_LINK_SERVICE = Symbol.for("posthog.core.taskLinkService");

export const TASK_LINK_LOGGER = Symbol.for("posthog.core.taskLinkLogger");
export const INBOX_LINK_LOGGER = Symbol.for("posthog.core.inboxLinkLogger");
export const NEW_TASK_LINK_LOGGER = Symbol.for(
  "posthog.core.newTaskLinkLogger",
);
