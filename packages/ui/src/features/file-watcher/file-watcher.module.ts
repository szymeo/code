import { WORKBENCH_CONTRIBUTION } from "@posthog/di/contribution";
import { ContainerModule } from "inversify";
import { FileWatcherContribution } from "./file-watcher.contribution";

export const fileWatcherUiModule = new ContainerModule(({ bind }) => {
  bind(WORKBENCH_CONTRIBUTION).to(FileWatcherContribution).inSingletonScope();
});
