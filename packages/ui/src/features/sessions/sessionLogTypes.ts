import type { RequestPermissionRequest } from "@agentclientprotocol/sdk";

export type PermissionRequest = Omit<RequestPermissionRequest, "sessionId"> & {
  taskRunId: string;
  receivedAt: number;
};
