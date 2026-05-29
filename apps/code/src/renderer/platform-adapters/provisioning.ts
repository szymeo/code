import type {
  ProvisioningOutput,
  ProvisioningOutputPort,
} from "@posthog/ui/features/provisioning/ports";
import { trpcClient } from "@renderer/trpc/client";
import { injectable } from "inversify";

@injectable()
export class TrpcProvisioningOutputService implements ProvisioningOutputPort {
  subscribe(handler: (output: ProvisioningOutput) => void): () => void {
    const subscription = trpcClient.provisioning.onOutput.subscribe(undefined, {
      onData: (data) => handler(data),
    });
    return () => subscription.unsubscribe();
  }
}
