export interface ProvisioningOutput {
  taskId: string;
  data: string;
}

export interface ProvisioningOutputPort {
  subscribe(handler: (output: ProvisioningOutput) => void): () => void;
}

export const PROVISIONING_OUTPUT_PORT = Symbol.for(
  "posthog.ui.provisioning.output",
);
