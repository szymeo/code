import type { WorkbenchContribution } from "@posthog/di/contribution";
import { WORKBENCH_LOGGER, type WorkbenchLogger } from "@posthog/di/logger";
import { inject, injectable } from "inversify";

@injectable()
export class FileWatcherContribution implements WorkbenchContribution {
  constructor(
    @inject(WORKBENCH_LOGGER)
    private readonly logger: WorkbenchLogger,
  ) {}

  start(): void {
    this.logger.info("file-watcher feature ready");
  }
}
