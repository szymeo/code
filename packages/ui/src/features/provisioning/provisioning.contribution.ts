import type { WorkbenchContribution } from "@posthog/di/contribution";
import { inject, injectable } from "inversify";
import { PROVISIONING_OUTPUT_PORT, type ProvisioningOutputPort } from "./ports";
import { useProvisioningStore } from "./store";

@injectable()
export class ProvisioningContribution implements WorkbenchContribution {
  constructor(
    @inject(PROVISIONING_OUTPUT_PORT)
    private readonly output: ProvisioningOutputPort,
  ) {}

  start(): void {
    this.output.subscribe(({ taskId, data }) => {
      useProvisioningStore.getState().appendChunk(taskId, data);
    });
  }
}
