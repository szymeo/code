export interface WorkbenchLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export const WORKBENCH_LOGGER = Symbol.for("posthog.workbench.logger");
