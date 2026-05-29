// PORT NOTE: bridge to the @posthog/workspace-server environment capability.
// Holds no logic — forwards CRUD to workspace-client. Delete this shim and the
// main `environment` router once the renderer settings/task-detail consumers
// read workspace-client.environment.* directly (see REFACTOR.md slice
// `environments`). Main `environment/schemas.ts` stays until then because the
// settings feature imports its types/schemas.
import type { WorkspaceClient } from "@posthog/workspace-client/client";
import type {
  CreateEnvironmentInput,
  Environment,
  UpdateEnvironmentInput,
} from "./schemas";

export class EnvironmentService {
  constructor(private readonly workspace: WorkspaceClient) {}

  listEnvironments(repoPath: string): Promise<Environment[]> {
    return this.workspace.environment.list.query({ repoPath });
  }

  getEnvironment(repoPath: string, id: string): Promise<Environment | null> {
    return this.workspace.environment.get.query({ repoPath, id });
  }

  createEnvironment(
    input: Omit<CreateEnvironmentInput, "repoPath">,
    repoPath: string,
  ): Promise<Environment> {
    return this.workspace.environment.create.mutate({ repoPath, ...input });
  }

  updateEnvironment(
    input: Omit<UpdateEnvironmentInput, "repoPath">,
    repoPath: string,
  ): Promise<Environment> {
    return this.workspace.environment.update.mutate({ repoPath, ...input });
  }

  deleteEnvironment(repoPath: string, id: string): Promise<void> {
    return this.workspace.environment.delete.mutate({ repoPath, id });
  }
}
