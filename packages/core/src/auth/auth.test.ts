import type { WorkbenchLogger } from "@posthog/di/logger";
import type { IPowerManager } from "@posthog/platform/power-manager";
import { OAUTH_SCOPE_VERSION } from "@posthog/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth";
import type {
  AuthConnectivityPort,
  AuthOAuthFlowPort,
  AuthPreferencePort,
  AuthPreferenceRecord,
  AuthSessionPort,
  AuthSessionRecord,
  AuthTokenCipherPort,
  ConnectivityStatus,
  PersistAuthSessionRecord,
} from "./ports";

vi.mock("@posthog/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@posthog/shared")>();
  return {
    ...actual,
    sleepWithBackoff: vi.fn().mockResolvedValue(undefined),
  };
});

const mockPowerManager = vi.hoisted(() => ({
  onResume: vi.fn(() => () => {}),
  preventSleep: vi.fn(() => () => {}),
}));

function createSessionPort(): AuthSessionPort {
  let current: AuthSessionRecord | null = null;
  return {
    getCurrent: () => (current ? { ...current } : null),
    saveCurrent: (input: PersistAuthSessionRecord) => {
      current = { ...input };
    },
    clearCurrent: () => {
      current = null;
    },
  };
}

function createPreferencePort(): AuthPreferencePort {
  const store = new Map<string, AuthPreferenceRecord>();
  return {
    get: (accountKey, cloudRegion) =>
      store.get(`${accountKey}:${cloudRegion}`) ?? null,
    save: (input) => {
      store.set(`${input.accountKey}:${input.cloudRegion}`, { ...input });
    },
  };
}

const identityCipher: AuthTokenCipherPort = {
  encrypt: (plaintext) => plaintext,
  decrypt: (encrypted) => encrypted,
};

const mockLogger: WorkbenchLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

function mockTokenResponse(
  overrides: {
    accessToken?: string;
    refreshToken?: string;
    scopedTeams?: number[];
    scopedOrgs?: string[];
  } = {},
) {
  return {
    success: true as const,
    data: {
      access_token: overrides.accessToken ?? "access-token",
      refresh_token: overrides.refreshToken ?? "refresh-token",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "",
      scoped_teams: overrides.scopedTeams ?? [42],
      scoped_organizations: overrides.scopedOrgs ?? ["org-1"],
    },
  };
}

describe("AuthService", () => {
  let sessionPort: AuthSessionPort;
  let preferencePort: AuthPreferencePort;

  const oauthFlow = {
    refreshToken: vi.fn(),
    startFlow: vi.fn(),
    startSignupFlow: vi.fn(),
    cancelFlow: vi.fn(),
  };

  let connectivityHandler: ((status: ConnectivityStatus) => void) | null = null;
  const connectivity: AuthConnectivityPort = {
    getStatus: vi.fn(() => ({ isOnline: true })),
    onStatusChange: vi.fn((handler) => {
      connectivityHandler = handler;
      return () => {
        connectivityHandler = null;
      };
    }),
  };

  let service: AuthService;

  function seedStoredSession(
    overrides: {
      refreshToken?: string;
      selectedProjectId?: number | null;
      scopeVersion?: number;
    } = {},
  ) {
    sessionPort.saveCurrent({
      refreshTokenEncrypted: overrides.refreshToken ?? "stored-refresh-token",
      cloudRegion: "us",
      selectedProjectId: overrides.selectedProjectId ?? null,
      scopeVersion: overrides.scopeVersion ?? OAUTH_SCOPE_VERSION,
    });
  }

  function emitStatus(isOnline: boolean) {
    connectivityHandler?.({ isOnline });
  }

  function getResumeHandler(): () => void {
    const call = mockPowerManager.onResume.mock.calls[0];
    return (call as unknown as [() => void])[0];
  }

  const stubAuthFetch = (accountKey = "user-1") => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | Request) => {
        const url = typeof input === "string" ? input : input.url;

        if (url.includes("/api/users/@me/")) {
          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ uuid: accountKey }),
          } as unknown as Response;
        }

        return {
          ok: true,
          json: vi.fn().mockResolvedValue({ has_access: true }),
        } as unknown as Response;
      }) as unknown as typeof fetch,
    );
  };

  function createService(): AuthService {
    return new AuthService(
      preferencePort,
      sessionPort,
      oauthFlow as unknown as AuthOAuthFlowPort,
      connectivity,
      identityCipher,
      mockPowerManager as unknown as IPowerManager,
      mockLogger,
      null,
    );
  }

  beforeEach(() => {
    sessionPort = createSessionPort();
    preferencePort = createPreferencePort();
    vi.clearAllMocks();
    connectivityHandler = null;
    vi.mocked(connectivity.getStatus).mockReturnValue({ isOnline: true });
    service = createService();
    service.init();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    service.shutdown();
    await service.logout();
  });

  it("bootstraps to anonymous when there is no stored session", async () => {
    await service.initialize();

    expect(service.getState()).toEqual({
      status: "anonymous",
      bootstrapComplete: true,
      cloudRegion: null,
      projectId: null,
      availableProjectIds: [],
      availableOrgIds: [],
      hasCodeAccess: null,
      needsScopeReauth: false,
    });
  });

  it("requires scope reauthentication when the stored scope version is stale", async () => {
    seedStoredSession({
      refreshToken: "refresh-token",
      selectedProjectId: 123,
      scopeVersion: OAUTH_SCOPE_VERSION - 1,
    });

    await service.initialize();

    expect(service.getState()).toEqual({
      status: "anonymous",
      bootstrapComplete: true,
      cloudRegion: "us",
      projectId: 123,
      availableProjectIds: [],
      availableOrgIds: [],
      hasCodeAccess: null,
      needsScopeReauth: true,
    });
  });

  it("restores an authenticated session by refreshing the stored refresh token", async () => {
    seedStoredSession({ selectedProjectId: 42 });
    oauthFlow.refreshToken.mockResolvedValue(
      mockTokenResponse({
        accessToken: "new-access-token",
        refreshToken: "rotated-refresh-token",
        scopedTeams: [42, 84],
      }),
    );
    stubAuthFetch();

    await service.initialize();

    expect(service.getState()).toMatchObject({
      status: "authenticated",
      bootstrapComplete: true,
      cloudRegion: "us",
      projectId: 42,
      availableProjectIds: [42, 84],
      availableOrgIds: ["org-1"],
      hasCodeAccess: true,
      needsScopeReauth: false,
    });

    expect(sessionPort.getCurrent()?.refreshTokenEncrypted).toBe(
      "rotated-refresh-token",
    );
  });

  it("forces a token refresh when explicitly requested", async () => {
    oauthFlow.startFlow.mockResolvedValue(
      mockTokenResponse({
        accessToken: "initial-access-token",
        refreshToken: "initial-refresh-token",
      }),
    );
    oauthFlow.refreshToken.mockResolvedValue(
      mockTokenResponse({
        accessToken: "refreshed-access-token",
        refreshToken: "rotated-refresh-token",
      }),
    );
    stubAuthFetch();

    await service.login("us");
    const token = await service.refreshAccessToken();

    expect(token.accessToken).toBe("refreshed-access-token");
    expect(oauthFlow.refreshToken).toHaveBeenCalledWith(
      "initial-refresh-token",
      "us",
    );
    expect(sessionPort.getCurrent()?.refreshTokenEncrypted).toBe(
      "rotated-refresh-token",
    );
  });

  it("preserves the selected project across logout and re-login for the same account", async () => {
    oauthFlow.startFlow
      .mockResolvedValueOnce(
        mockTokenResponse({
          accessToken: "initial-access-token",
          refreshToken: "initial-refresh-token",
          scopedTeams: [42, 84],
        }),
      )
      .mockResolvedValueOnce(
        mockTokenResponse({
          accessToken: "second-access-token",
          refreshToken: "second-refresh-token",
          scopedTeams: [42, 84],
        }),
      );
    oauthFlow.refreshToken.mockResolvedValue(
      mockTokenResponse({
        accessToken: "refreshed-access-token",
        refreshToken: "refreshed-refresh-token",
        scopedTeams: [42, 84],
      }),
    );
    stubAuthFetch();

    await service.login("us");
    await service.selectProject(84);
    await service.logout();

    expect(service.getState()).toMatchObject({
      status: "anonymous",
      cloudRegion: "us",
      projectId: 84,
    });

    await service.login("us");

    expect(service.getState()).toMatchObject({
      status: "authenticated",
      cloudRegion: "us",
      projectId: 84,
      availableProjectIds: [42, 84],
    });
  });

  it("restores the selected project after app restart while logged out", async () => {
    oauthFlow.startFlow
      .mockResolvedValueOnce(
        mockTokenResponse({
          accessToken: "initial-access-token",
          refreshToken: "initial-refresh-token",
          scopedTeams: [42, 84],
        }),
      )
      .mockResolvedValueOnce(
        mockTokenResponse({
          accessToken: "second-access-token",
          refreshToken: "second-refresh-token",
          scopedTeams: [42, 84],
        }),
      );
    oauthFlow.refreshToken.mockResolvedValue(
      mockTokenResponse({
        accessToken: "refreshed-access-token",
        refreshToken: "refreshed-refresh-token",
        scopedTeams: [42, 84],
      }),
    );
    stubAuthFetch();

    await service.login("us");
    await service.selectProject(84);
    await service.logout();

    service = createService();

    await service.login("us");

    expect(service.getState()).toMatchObject({
      status: "authenticated",
      cloudRegion: "us",
      projectId: 84,
      availableProjectIds: [42, 84],
    });
  });

  describe("lifecycle: connectivity recovery", () => {
    it("recovers session when connectivity changes to online", async () => {
      seedStoredSession({ selectedProjectId: 42 });
      vi.mocked(connectivity.getStatus).mockReturnValue({ isOnline: false });
      await service.initialize();
      expect(service.getState().status).toBe("anonymous");

      vi.mocked(connectivity.getStatus).mockReturnValue({ isOnline: true });
      oauthFlow.refreshToken.mockResolvedValue(mockTokenResponse());
      stubAuthFetch();

      emitStatus(true);

      await vi.waitFor(() => {
        expect(service.getState().status).toBe("authenticated");
      });
    });

    it("does nothing when session already exists", async () => {
      oauthFlow.startFlow.mockResolvedValue(mockTokenResponse());
      stubAuthFetch();
      await service.login("us");
      oauthFlow.refreshToken.mockClear();

      emitStatus(true);

      await new Promise((r) => setTimeout(r, 10));
      expect(oauthFlow.refreshToken).not.toHaveBeenCalled();
    });

    it("ignores offline events", async () => {
      seedStoredSession();

      emitStatus(false);

      await new Promise((r) => setTimeout(r, 10));
      expect(oauthFlow.refreshToken).not.toHaveBeenCalled();
    });

    it("deduplicates concurrent recovery attempts", async () => {
      seedStoredSession();

      let resolveRefresh!: () => void;
      oauthFlow.refreshToken.mockReturnValue(
        new Promise((resolve) => {
          resolveRefresh = () => resolve(mockTokenResponse());
        }),
      );
      stubAuthFetch();

      emitStatus(true);
      emitStatus(true);

      await new Promise((r) => setTimeout(r, 10));
      expect(oauthFlow.refreshToken).toHaveBeenCalledTimes(1);

      resolveRefresh();

      await vi.waitFor(() => {
        expect(service.getState().status).toBe("authenticated");
      });
    });
  });

  describe("lifecycle: power monitor resume", () => {
    it("registers and unregisters the resume handler", () => {
      expect(mockPowerManager.onResume).toHaveBeenCalledWith(
        expect.any(Function),
      );
      const unsubscribe = mockPowerManager.onResume.mock.results[0]?.value as
        | (() => void)
        | undefined;

      service.shutdown();
      expect(unsubscribe).toBeDefined();
    });

    it("attempts session recovery on resume", async () => {
      seedStoredSession();
      oauthFlow.refreshToken.mockResolvedValue(mockTokenResponse());
      stubAuthFetch();

      getResumeHandler()();

      await vi.waitFor(() => {
        expect(service.getState().status).toBe("authenticated");
      });
    });
  });

  describe("refresh retry with error codes", () => {
    it.each([
      { errorCode: "network_error" as const, label: "network_error" },
      { errorCode: "server_error" as const, label: "server_error" },
    ])(
      "retries on $label and succeeds on second attempt",
      async ({ errorCode }) => {
        seedStoredSession();
        oauthFlow.refreshToken
          .mockResolvedValueOnce({
            success: false,
            error: "Transient failure",
            errorCode,
          })
          .mockResolvedValueOnce(mockTokenResponse());
        stubAuthFetch();

        await service.initialize();

        expect(service.getState().status).toBe("authenticated");
        expect(oauthFlow.refreshToken).toHaveBeenCalledTimes(2);
      },
    );

    it("does not retry on auth_error and forces logout", async () => {
      seedStoredSession({ selectedProjectId: 42 });
      oauthFlow.refreshToken.mockResolvedValue({
        success: false,
        error: "Token revoked",
        errorCode: "auth_error",
      });

      await service.initialize();

      expect(service.getState()).toMatchObject({
        status: "anonymous",
        cloudRegion: "us",
        projectId: 42,
      });
      expect(oauthFlow.refreshToken).toHaveBeenCalledTimes(1);
      expect(sessionPort.getCurrent()).toBeNull();
    });

    it("does not retry on unknown_error", async () => {
      seedStoredSession();
      oauthFlow.refreshToken.mockResolvedValue({
        success: false,
        error: "Something weird",
        errorCode: "unknown_error",
      });

      await service.initialize();

      expect(service.getState().status).toBe("anonymous");
      expect(oauthFlow.refreshToken).toHaveBeenCalledTimes(1);
    });

    it("gives up after all retry attempts are exhausted", async () => {
      seedStoredSession();
      oauthFlow.refreshToken.mockResolvedValue({
        success: false,
        error: "Network error",
        errorCode: "network_error",
      });

      await service.initialize();

      expect(service.getState().status).toBe("anonymous");
      expect(oauthFlow.refreshToken).toHaveBeenCalledTimes(3);
    });
  });

  describe("redeemInviteCode uses authenticatedFetch", () => {
    it("retries on 401 via authenticatedFetch", async () => {
      oauthFlow.startFlow.mockResolvedValue(
        mockTokenResponse({
          accessToken: "initial-token",
          refreshToken: "refresh-token",
        }),
      );
      oauthFlow.refreshToken.mockResolvedValue(
        mockTokenResponse({
          accessToken: "refreshed-token",
          refreshToken: "new-refresh-token",
        }),
      );

      let redeemCallCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string | Request) => {
          const url = typeof input === "string" ? input : input.url;

          if (url.includes("/api/users/@me/")) {
            return {
              ok: true,
              json: vi.fn().mockResolvedValue({ uuid: "user-1" }),
            } as unknown as Response;
          }

          if (url.includes("/invites/redeem/")) {
            redeemCallCount++;
            if (redeemCallCount === 1) {
              return {
                ok: false,
                status: 401,
                json: () => Promise.resolve({}),
              } as unknown as Response;
            }
            return {
              ok: true,
              status: 200,
              json: () => Promise.resolve({ success: true }),
            } as unknown as Response;
          }

          return {
            ok: true,
            json: vi.fn().mockResolvedValue({ has_access: true }),
          } as unknown as Response;
        }) as unknown as typeof fetch,
      );

      await service.login("us");
      const state = await service.redeemInviteCode("test-code");

      expect(state.hasCodeAccess).toBe(true);
      expect(redeemCallCount).toBe(2);
    });
  });
});
