// PORT NOTE: bridge to the @posthog/workspace-server connectivity capability.
// Caches the latest status locally so AuthService can read getStatus()
// synchronously and react to StatusChange events. Delete when AuthService and
// the connectivity tRPC router consume workspaceClient.connectivity directly.
import type { WorkspaceClient } from "@posthog/workspace-client/client";
import { TypedEventEmitter } from "../../utils/typed-event-emitter";
import {
  ConnectivityEvent,
  type ConnectivityEvents,
  type ConnectivityStatusOutput,
} from "./schemas";

export class ConnectivityService extends TypedEventEmitter<ConnectivityEvents> {
  private isOnline = true;

  constructor(private readonly workspace: WorkspaceClient) {
    super();
    this.setMaxListeners(0);
    this.workspace.connectivity.onStatusChange.subscribe(undefined, {
      onData: (status) => {
        this.isOnline = status.isOnline;
        this.emit(ConnectivityEvent.StatusChange, status);
      },
      onError: () => {},
    });
    void this.workspace.connectivity.getStatus
      .query()
      .then((status) => {
        this.isOnline = status.isOnline;
      })
      .catch(() => {});
  }

  getStatus(): ConnectivityStatusOutput {
    return { isOnline: this.isOnline };
  }

  async checkNow(): Promise<ConnectivityStatusOutput> {
    const status = await this.workspace.connectivity.checkNow.mutate();
    this.isOnline = status.isOnline;
    return status;
  }
}
