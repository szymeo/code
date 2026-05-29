import type { CancelFlowOutput } from "@posthog/core/auth/oauth.schemas";
import type {
  AuthState,
  ValidAccessTokenOutput,
} from "@posthog/core/auth/schemas";
import type { CloudRegion } from "@posthog/shared";

/**
 * Renderer-side client for the host AuthService (main electron-trpc `auth` /
 * `oauth` routers). Desktop adapter wraps `trpcClient.auth.*` /
 * `trpcClient.oauth.*`; packages/ui resolves it via useService — keeping the UI
 * host-agnostic (no @renderer/trpc import, no main TrpcRouter type). This is the
 * canonical option-(d) main-router access pattern (see ui-main-trpc-access).
 */
export interface AuthClient {
  getState(): Promise<AuthState>;
  getValidAccessToken(): Promise<ValidAccessTokenOutput>;
  login(region: CloudRegion): Promise<AuthState>;
  signup(region: CloudRegion): Promise<AuthState>;
  logout(): Promise<AuthState>;
  refreshAccessToken(): Promise<ValidAccessTokenOutput>;
  redeemInviteCode(code: string): Promise<AuthState>;
  selectProject(projectId: number): Promise<AuthState>;
  cancelOAuthFlow(): Promise<CancelFlowOutput>;
  onStateChanged(handler: (state: AuthState) => void): () => void;
}

export const AUTH_CLIENT = Symbol.for("posthog.ui.auth.client");

/**
 * Host-side cross-feature coordination triggered by auth mutations (query-cache
 * invalidation, navigation, onboarding/session resets, analytics). These live
 * outside packages/ui because they reach other app features; the desktop binds
 * an adapter. Move each effect into the owning feature's contribution as those
 * features migrate, then shrink this port.
 */
export interface AuthSideEffects {
  onAuthSuccess(region: CloudRegion, projectId: number | null): void;
  beforeProjectSwitch(): void;
  onProjectSelected(): void;
  onLogout(previousRegion: CloudRegion | null): void;
}

export const AUTH_SIDE_EFFECTS = Symbol.for("posthog.ui.auth.sideEffects");
