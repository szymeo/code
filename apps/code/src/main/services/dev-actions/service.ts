import type { IDevHostActions } from "@posthog/platform/dev-host-actions";
import { inject, injectable } from "inversify";
import { MAIN_TOKENS } from "../../di/tokens";
import { getUserDataDir } from "../../utils/env";
import { getLogFilePath, logger } from "../../utils/logger";
import { TypedEventEmitter } from "../../utils/typed-event-emitter";
import type { DevNetworkService } from "../dev-network/service";
import {
  DevActionsEvent,
  type DevActionsEvents,
  type DevToast,
} from "./schemas";

const log = logger.scope("dev-actions");

@injectable()
export class DevActionsService extends TypedEventEmitter<DevActionsEvents> {
  private nextToastId = 1;

  constructor(
    @inject(MAIN_TOKENS.DevNetworkService)
    private readonly network: DevNetworkService,
    @inject(MAIN_TOKENS.DevHostActions)
    private readonly host: IDevHostActions,
  ) {
    super();
  }

  async openUserDataDir(): Promise<void> {
    await this.host.openPath(getUserDataDir());
  }

  async openLogFile(): Promise<void> {
    await this.host.openPath(getLogFilePath());
  }

  reloadRenderer(): void {
    this.host.reloadAllWindows();
  }

  restartMain(): void {
    log.warn("Restarting main process from dev toolbar");
    this.host.relaunch();
  }

  crashMain(): void {
    log.warn("Crashing main process from dev toolbar");
    this.host.crash();
  }

  triggerToast(variant: "info" | "error", message: string): DevToast {
    const toast: DevToast = {
      id: this.nextToastId++,
      variant,
      message,
    };
    this.emit(DevActionsEvent.Toast, toast);
    return toast;
  }

  setOffline(offline: boolean): void {
    this.network.setSim({ offline });
  }

  setSlowDelay(slowDelayMs: number): void {
    this.network.setSim({ slowDelayMs });
  }
}
