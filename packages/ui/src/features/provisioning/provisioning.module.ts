import { WORKBENCH_CONTRIBUTION } from "@posthog/di/contribution";
import { ContainerModule } from "inversify";
import { ProvisioningContribution } from "./provisioning.contribution";

export const provisioningUiModule = new ContainerModule(({ bind }) => {
  bind(WORKBENCH_CONTRIBUTION).to(ProvisioningContribution).inSingletonScope();
});
