// PORT NOTE: bridge to the @posthog/workspace-server local-logs capability.
// Delete when the logs tRPC router and the renderer sessions service consume
// workspaceClient.localLogs directly (and handoff seedLocalLogs stops writing
// the same NDJSON via raw fs).
import type { WorkspaceClient } from "@posthog/workspace-client/client";

export class LocalLogsService {
  constructor(private readonly workspace: WorkspaceClient) {}

  readLocalLogs(taskRunId: string): Promise<string | null> {
    return this.workspace.localLogs.read.query({ taskRunId });
  }

  writeLocalLogs(taskRunId: string, content: string): Promise<void> {
    return this.workspace.localLogs.write.mutate({ taskRunId, content });
  }
}
