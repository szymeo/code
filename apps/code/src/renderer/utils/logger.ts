import {
  type HostLogger,
  logger as uiLogger,
  setLogger,
} from "@posthog/ui/workbench/logger";
import log from "electron-log/renderer";

log.transports.console.level = "debug";

// PORT NOTE: register the host electron-log logger with @posthog/ui's logger
// port so packages/ui stores/components can log without importing electron-log
// or apps/code. This shim re-exports the port logger; retire once callers import
// from @posthog/ui/workbench/logger directly.
setLogger(log as unknown as HostLogger);

export const logger = uiLogger;
