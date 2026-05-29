import type { CancelFlowOutput } from "@posthog/core/auth/oauth.schemas";
import type {
  AuthState,
  ValidAccessTokenOutput,
} from "@posthog/core/auth/schemas";
import type { CloudRegion } from "@posthog/shared";
import type { AuthClient } from "@posthog/ui/features/auth/ports";
import { trpcClient } from "@renderer/trpc/client";
import { injectable } from "inversify";

@injectable()
export class TrpcAuthClient implements AuthClient {
  getState(): Promise<AuthState> {
    return trpcClient.auth.getState.query();
  }

  getValidAccessToken(): Promise<ValidAccessTokenOutput> {
    return trpcClient.auth.getValidAccessToken.query();
  }

  login(region: CloudRegion): Promise<AuthState> {
    return trpcClient.auth.login.mutate({ region }).then((r) => r.state);
  }

  signup(region: CloudRegion): Promise<AuthState> {
    return trpcClient.auth.signup.mutate({ region }).then((r) => r.state);
  }

  logout(): Promise<AuthState> {
    return trpcClient.auth.logout.mutate();
  }

  refreshAccessToken(): Promise<ValidAccessTokenOutput> {
    return trpcClient.auth.refreshAccessToken.mutate();
  }

  redeemInviteCode(code: string): Promise<AuthState> {
    return trpcClient.auth.redeemInviteCode.mutate({ code });
  }

  selectProject(projectId: number): Promise<AuthState> {
    return trpcClient.auth.selectProject.mutate({ projectId });
  }

  cancelOAuthFlow(): Promise<CancelFlowOutput> {
    return trpcClient.oauth.cancelFlow.mutate();
  }

  onStateChanged(handler: (state: AuthState) => void): () => void {
    const subscription = trpcClient.auth.onStateChanged.subscribe(undefined, {
      onData: (state) => handler(state),
    });
    return () => subscription.unsubscribe();
  }
}
