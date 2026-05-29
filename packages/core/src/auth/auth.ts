import { WORKBENCH_LOGGER, type WorkbenchLogger } from "@posthog/di/logger";
import {
  type IPowerManager,
  POWER_MANAGER_SERVICE,
} from "@posthog/platform/power-manager";
import {
  type BackoffOptions,
  type CloudRegion,
  getCloudUrlFromRegion,
  NotAuthenticatedError,
  OAUTH_SCOPE_VERSION,
  sleepWithBackoff,
  TypedEventEmitter,
} from "@posthog/shared";
import { inject, injectable, postConstruct, preDestroy } from "inversify";
import {
  AUTH_CONNECTIVITY_PORT,
  AUTH_OAUTH_FLOW_PORT,
  AUTH_PREFERENCE_PORT,
  AUTH_SESSION_PORT,
  AUTH_TOKEN_CIPHER_PORT,
  AUTH_TOKEN_OVERRIDE,
  type AuthConnectivityPort,
  type AuthOAuthFlowPort,
  type AuthPreferencePort,
  type AuthSessionPort,
  type AuthTokenCipherPort,
} from "./ports";
import {
  AuthServiceEvent,
  type AuthServiceEvents,
  type AuthState,
  type AuthTokenResponse,
  type ValidAccessTokenOutput,
} from "./schemas";

const TOKEN_EXPIRY_SKEW_MS = 60_000;
type FetchLike = (
  input: string | Request,
  init?: RequestInit,
) => Promise<Response>;

interface InMemorySession {
  accountKey: string | null;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  cloudRegion: CloudRegion;
  projectId: number | null;
  availableProjectIds: number[];
  availableOrgIds: string[];
}

interface StoredSessionInput {
  refreshToken: string;
  cloudRegion: CloudRegion;
  selectedProjectId: number | null;
}

interface TokenResponseOptions {
  cloudRegion: CloudRegion;
  selectedProjectId: number | null;
}

@injectable()
export class AuthService extends TypedEventEmitter<AuthServiceEvents> {
  private state: AuthState = {
    status: "anonymous",
    bootstrapComplete: false,
    cloudRegion: null,
    projectId: null,
    availableProjectIds: [],
    availableOrgIds: [],
    hasCodeAccess: null,
    needsScopeReauth: false,
  };
  private session: InMemorySession | null = null;
  private initializePromise: Promise<void> | null = null;
  private refreshPromise: Promise<InMemorySession> | null = null;
  constructor(
    @inject(AUTH_PREFERENCE_PORT)
    private readonly authPreference: AuthPreferencePort,
    @inject(AUTH_SESSION_PORT)
    private readonly authSession: AuthSessionPort,
    @inject(AUTH_OAUTH_FLOW_PORT)
    private readonly oauthFlow: AuthOAuthFlowPort,
    @inject(AUTH_CONNECTIVITY_PORT)
    private readonly connectivity: AuthConnectivityPort,
    @inject(AUTH_TOKEN_CIPHER_PORT)
    private readonly cipher: AuthTokenCipherPort,
    @inject(POWER_MANAGER_SERVICE)
    private readonly powerManager: IPowerManager,
    @inject(WORKBENCH_LOGGER)
    private readonly logger: WorkbenchLogger,
    @inject(AUTH_TOKEN_OVERRIDE)
    private readonly tokenOverride: string | null,
  ) {
    super();
  }
  async initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = this.doInitialize();
    return this.initializePromise;
  }
  getState(): AuthState {
    return { ...this.state };
  }
  async login(region: CloudRegion): Promise<AuthState> {
    await this.authenticateWithFlow(
      () => this.oauthFlow.startFlow(region),
      region,
      "OAuth flow failed",
    );
    return this.getState();
  }
  async signup(region: CloudRegion): Promise<AuthState> {
    await this.authenticateWithFlow(
      () => this.oauthFlow.startSignupFlow(region),
      region,
      "Signup failed",
    );
    return this.getState();
  }
  async getValidAccessToken(): Promise<ValidAccessTokenOutput> {
    const override = this.tokenOverride;
    if (override) {
      await this.initialize();
      const region = this.session?.cloudRegion ?? "us";
      return {
        accessToken: override,
        apiHost: getCloudUrlFromRegion(region),
      };
    }

    await this.initialize();

    const session = await this.ensureValidSession();
    return {
      accessToken: session.accessToken,
      apiHost: getCloudUrlFromRegion(session.cloudRegion),
    };
  }
  async refreshAccessToken(): Promise<ValidAccessTokenOutput> {
    const override = this.tokenOverride;
    if (override) {
      await this.initialize();
      const region = this.session?.cloudRegion ?? "us";
      return {
        accessToken: override,
        apiHost: getCloudUrlFromRegion(region),
      };
    }

    await this.initialize();

    const session = await this.ensureValidSession(true);
    return {
      accessToken: session.accessToken,
      apiHost: getCloudUrlFromRegion(session.cloudRegion),
    };
  }
  async invalidateAccessTokenForTest(): Promise<void> {
    await this.initialize();

    if (!this.session) {
      return;
    }

    this.session = {
      ...this.session,
      accessToken: `${this.session.accessToken}_invalid`,
      accessTokenExpiresAt: Date.now() + 5 * 60 * 1000,
    };
  }
  async authenticatedFetch(
    fetchImpl: FetchLike,
    input: string | Request,
    init: RequestInit = {},
  ): Promise<Response> {
    const initialAuth = await this.getValidAccessToken();
    let response = await this.executeAuthenticatedFetch(
      fetchImpl,
      input,
      init,
      initialAuth.accessToken,
    );

    if (response.status === 401 || response.status === 403) {
      const refreshedAuth = await this.refreshAccessToken();
      response = await this.executeAuthenticatedFetch(
        fetchImpl,
        input,
        init,
        refreshedAuth.accessToken,
      );
    }

    return response;
  }
  async redeemInviteCode(code: string): Promise<AuthState> {
    const { apiHost } = await this.getValidAccessToken();
    const response = await this.authenticatedFetch(
      fetch,
      `${apiHost}/api/code/invites/redeem/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to redeem invite code");
    }

    this.updateState({ hasCodeAccess: true });
    return this.getState();
  }
  async selectProject(projectId: number): Promise<AuthState> {
    await this.initialize();

    const session = this.requireSession();

    if (!session.availableProjectIds.includes(projectId)) {
      throw new Error("Invalid project selection");
    }

    this.session = {
      ...session,
      projectId,
    };

    this.persistProjectPreference(this.session);
    this.persistSession({
      refreshToken: this.session.refreshToken,
      cloudRegion: this.session.cloudRegion,
      selectedProjectId: projectId,
    });

    this.updateState({ projectId });
    return this.getState();
  }
  async logout(): Promise<AuthState> {
    const { cloudRegion, projectId } = this.state;

    this.authSession.clearCurrent();
    this.session = null;
    this.setAnonymousState({ cloudRegion, projectId });
    return this.getState();
  }
  private executeAuthenticatedFetch(
    fetchImpl: FetchLike,
    input: string | Request,
    init: RequestInit,
    accessToken: string,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${accessToken}`);

    return fetchImpl(input, {
      ...init,
      headers,
    });
  }
  private async doInitialize(): Promise<void> {
    const stored = this.authSession.getCurrent();

    if (!stored) {
      this.setAnonymousState({ bootstrapComplete: true });
      return;
    }

    if (stored.scopeVersion < OAUTH_SCOPE_VERSION) {
      this.session = null;
      this.setAnonymousState({
        bootstrapComplete: true,
        cloudRegion: stored.cloudRegion,
        projectId: stored.selectedProjectId,
        needsScopeReauth: true,
      });
      return;
    }

    const storedSession = this.resolveStoredSession();
    if (!storedSession) {
      this.logger.warn("Stored auth session could not be decrypted");
      this.authSession.clearCurrent();
      this.setAnonymousState({ bootstrapComplete: true });
      return;
    }

    try {
      await this.refreshAndSyncSession(storedSession);
    } catch (error) {
      this.logger.warn("Failed to restore stored auth session", { error });
      this.session = null;
      this.setAnonymousState({
        bootstrapComplete: true,
        cloudRegion: storedSession.cloudRegion,
        projectId: storedSession.selectedProjectId,
      });
    }
  }
  private async ensureValidSession(
    forceRefresh = false,
  ): Promise<InMemorySession> {
    if (
      this.session &&
      !forceRefresh &&
      !this.isSessionExpiring(this.session)
    ) {
      return this.session;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const sessionInput = this.getSessionInputForRefresh();

    this.refreshPromise = this.refreshSession(sessionInput).finally(() => {
      this.refreshPromise = null;
    });

    const session = await this.refreshPromise;
    await this.syncAuthenticatedSession(session);
    return session;
  }

  private getSessionInputForRefresh(): StoredSessionInput {
    if (this.session) {
      return {
        refreshToken: this.session.refreshToken,
        cloudRegion: this.session.cloudRegion,
        selectedProjectId: this.session.projectId,
      };
    }

    const storedSession = this.resolveStoredSession();
    if (!storedSession) {
      throw new NotAuthenticatedError();
    }

    return storedSession;
  }
  private async refreshSession(
    input: StoredSessionInput,
  ): Promise<InMemorySession> {
    if (!this.connectivity.getStatus().isOnline) {
      throw new Error("Offline");
    }

    let lastError = "Token refresh failed";

    for (
      let attempt = 0;
      attempt < AuthService.REFRESH_MAX_ATTEMPTS;
      attempt++
    ) {
      const result = await this.oauthFlow.refreshToken(
        input.refreshToken,
        input.cloudRegion,
      );

      if (result.success && result.data) {
        return await this.createSessionFromTokenResponse(result.data, input);
      }

      lastError = result.error || "Token refresh failed";

      if (result.errorCode === "auth_error") {
        this.logger.warn("Refresh token rejected by server, forcing logout");
        this.authSession.clearCurrent();
        this.session = null;
        this.setAnonymousState({
          cloudRegion: input.cloudRegion,
          projectId: input.selectedProjectId,
        });
        throw new Error(lastError);
      }

      const isRetryable =
        result.errorCode === "network_error" ||
        result.errorCode === "server_error";

      if (!isRetryable) {
        throw new Error(lastError);
      }

      const isLastAttempt = attempt === AuthService.REFRESH_MAX_ATTEMPTS - 1;
      if (isLastAttempt) break;

      this.logger.warn("Transient refresh failure, retrying", {
        attempt,
        errorCode: result.errorCode,
      });
      await sleepWithBackoff(attempt, AuthService.REFRESH_BACKOFF);
    }

    throw new Error(lastError);
  }
  private async createSessionFromTokenResponse(
    tokenResponse: AuthTokenResponse,
    options: TokenResponseOptions,
  ): Promise<InMemorySession> {
    const availableProjectIds = tokenResponse.scoped_teams ?? [];
    const availableOrgIds = tokenResponse.scoped_organizations ?? [];
    const accountKey = await this.fetchAccountKey(
      tokenResponse.access_token,
      options.cloudRegion,
    );
    const preferredProjectId =
      options.selectedProjectId ??
      (accountKey
        ? (this.authPreference.get(accountKey, options.cloudRegion)
            ?.lastSelectedProjectId ?? null)
        : null);
    const projectId =
      preferredProjectId && availableProjectIds.includes(preferredProjectId)
        ? preferredProjectId
        : (availableProjectIds[0] ?? null);

    const session: InMemorySession = {
      accountKey,
      accessToken: tokenResponse.access_token,
      accessTokenExpiresAt: Date.now() + tokenResponse.expires_in * 1000,
      refreshToken: tokenResponse.refresh_token,
      cloudRegion: options.cloudRegion,
      projectId,
      availableProjectIds,
      availableOrgIds,
    };

    return session;
  }
  private async authenticateWithFlow(
    runFlow: () => Promise<{
      success: boolean;
      data?: AuthTokenResponse;
      error?: string;
    }>,
    region: CloudRegion,
    fallbackError: string,
  ): Promise<void> {
    const result = await runFlow();
    if (!result.success || !result.data) {
      throw new Error(result.error || fallbackError);
    }

    const session = await this.createSessionFromTokenResponse(result.data, {
      cloudRegion: region,
      selectedProjectId: this.state.projectId,
    });
    await this.syncAuthenticatedSession(session);
  }
  private async refreshAndSyncSession(
    input: StoredSessionInput,
  ): Promise<void> {
    const session = await this.refreshSession(input);
    await this.syncAuthenticatedSession(session);
  }
  private async syncAuthenticatedSession(
    session: InMemorySession,
  ): Promise<void> {
    this.persistProjectPreference(session);
    this.persistSession({
      refreshToken: session.refreshToken,
      cloudRegion: session.cloudRegion,
      selectedProjectId: session.projectId,
    });

    this.session = session;
    this.updateState({
      status: "authenticated",
      bootstrapComplete: true,
      cloudRegion: session.cloudRegion,
      projectId: session.projectId,
      availableProjectIds: session.availableProjectIds,
      availableOrgIds: session.availableOrgIds,
      needsScopeReauth: false,
    });
    await this.updateCodeAccessFromSession();
  }
  private persistSession(input: {
    refreshToken: string;
    cloudRegion: CloudRegion;
    selectedProjectId: number | null;
  }): void {
    this.authSession.saveCurrent({
      refreshTokenEncrypted: this.cipher.encrypt(input.refreshToken),
      cloudRegion: input.cloudRegion,
      selectedProjectId: input.selectedProjectId,
      scopeVersion: OAUTH_SCOPE_VERSION,
    });
  }
  private persistProjectPreference(session: InMemorySession): void {
    if (!session.accountKey) {
      return;
    }

    this.authPreference.save({
      accountKey: session.accountKey,
      cloudRegion: session.cloudRegion,
      lastSelectedProjectId: session.projectId,
    });
  }
  private isSessionExpiring(session: InMemorySession): boolean {
    return session.accessTokenExpiresAt - Date.now() <= TOKEN_EXPIRY_SKEW_MS;
  }
  private async fetchAccountKey(
    accessToken: string,
    cloudRegion: CloudRegion,
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${getCloudUrlFromRegion(cloudRegion)}/api/users/@me/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json().catch(() => ({}))) as {
        uuid?: unknown;
        distinct_id?: unknown;
        email?: unknown;
      };

      if (typeof data.uuid === "string" && data.uuid.length > 0) {
        return data.uuid;
      }
      if (typeof data.distinct_id === "string" && data.distinct_id.length > 0) {
        return data.distinct_id;
      }
      if (typeof data.email === "string" && data.email.length > 0) {
        return data.email;
      }

      return null;
    } catch (error) {
      this.logger.warn("Failed to resolve auth account key", { error });
      return null;
    }
  }
  private requireSession(): InMemorySession {
    if (!this.session) {
      throw new NotAuthenticatedError();
    }
    return this.session;
  }
  private setAnonymousState(
    partial: Pick<
      Partial<AuthState>,
      "bootstrapComplete" | "cloudRegion" | "projectId" | "needsScopeReauth"
    > = {},
  ): void {
    this.updateState({
      status: "anonymous",
      bootstrapComplete: partial.bootstrapComplete ?? true,
      cloudRegion: partial.cloudRegion ?? null,
      projectId: partial.projectId ?? null,
      availableProjectIds: [],
      availableOrgIds: [],
      hasCodeAccess: null,
      needsScopeReauth: partial.needsScopeReauth ?? false,
    });
  }
  private async updateCodeAccessFromSession(): Promise<void> {
    if (!this.session) {
      this.updateState({ hasCodeAccess: null });
      return;
    }

    try {
      const apiHost = getCloudUrlFromRegion(this.session.cloudRegion);
      const response = await this.executeAuthenticatedFetch(
        fetch,
        `${apiHost}/api/code/invites/check-access/`,
        {},
        this.session.accessToken,
      );
      const data = (await response.json().catch(() => ({}))) as {
        has_access?: boolean;
      };

      this.updateState({ hasCodeAccess: data.has_access === true });
    } catch (error) {
      this.logger.warn("Failed to update code access state", { error });
      this.updateState({ hasCodeAccess: false });
    }
  }
  private static readonly REFRESH_MAX_ATTEMPTS = 3;
  private static readonly REFRESH_BACKOFF: BackoffOptions = {
    initialDelayMs: 1_000,
    maxDelayMs: 5_000,
    multiplier: 2,
  };
  private recoveryPromise: Promise<void> | null = null;
  private connectivityUnsubscribe: (() => void) | null = null;
  private resumeUnsubscribe: (() => void) | null = null;
  @postConstruct()
  init(): void {
    this.connectivityUnsubscribe = this.connectivity.onStatusChange(
      (status) => {
        if (status.isOnline) {
          this.attemptSessionRecovery();
        }
      },
    );

    this.resumeUnsubscribe = this.powerManager.onResume(this.handleResume);
  }
  @preDestroy()
  shutdown(): void {
    this.connectivityUnsubscribe?.();
    this.connectivityUnsubscribe = null;
    this.resumeUnsubscribe?.();
    this.resumeUnsubscribe = null;
  }
  private handleResume = (): void => {
    this.attemptSessionRecovery();
  };
  private resolveStoredSession(): StoredSessionInput | null {
    const stored = this.authSession.getCurrent();
    if (!stored) return null;

    const refreshToken = this.cipher.decrypt(stored.refreshTokenEncrypted);
    if (!refreshToken) return null;

    return {
      refreshToken,
      cloudRegion: stored.cloudRegion,
      selectedProjectId: stored.selectedProjectId,
    };
  }
  private attemptSessionRecovery(): void {
    if (this.session) return;
    if (this.recoveryPromise) return;

    const stored = this.authSession.getCurrent();
    if (!stored) return;
    if (stored.scopeVersion < OAUTH_SCOPE_VERSION) return;

    const storedSession = this.resolveStoredSession();
    if (!storedSession) return;

    this.recoveryPromise = this.refreshAndSyncSession(storedSession)
      .catch((error) => {
        this.logger.warn("Session recovery failed", { error });
      })
      .finally(() => {
        this.recoveryPromise = null;
      });
  }

  private updateState(partial: Partial<AuthState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.emit(AuthServiceEvent.StateChanged, this.getState());
  }
}
