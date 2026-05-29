import type { CloudRegion } from "@posthog/shared";
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
} from "@posthog/core/auth/ports";
import type {
  CancelFlowOutput,
  RefreshTokenOutput,
  StartFlowOutput,
} from "@posthog/core/auth/oauth.schemas";
import type { IAuthPreferenceRepository } from "@posthog/workspace-server/db/repositories/auth-preference-repository";
import type { IAuthSessionRepository } from "@posthog/workspace-server/db/repositories/auth-session-repository";
import { inject, injectable } from "inversify";
import { MAIN_TOKENS } from "../../di/tokens";
import { decrypt, encrypt } from "../../utils/encryption";
import { ConnectivityEvent } from "../connectivity/schemas";
import type { ConnectivityService } from "../connectivity/service";
import { OAUTH_SERVICE } from "@posthog/core/oauth/identifiers";
import type { OAuthService } from "@posthog/core/oauth/oauth";

@injectable()
export class TokenCipherPortAdapter implements AuthTokenCipherPort {
  encrypt(plaintext: string): string {
    return encrypt(plaintext);
  }

  decrypt(encrypted: string): string | null {
    return decrypt(encrypted);
  }
}

@injectable()
export class OAuthFlowPortAdapter implements AuthOAuthFlowPort {
  constructor(
    @inject(OAUTH_SERVICE)
    private readonly oauth: OAuthService,
  ) {}

  startFlow(region: CloudRegion): Promise<StartFlowOutput> {
    return this.oauth.startFlow(region);
  }

  startSignupFlow(region: CloudRegion): Promise<StartFlowOutput> {
    return this.oauth.startSignupFlow(region);
  }

  refreshToken(
    refreshToken: string,
    region: CloudRegion,
  ): Promise<RefreshTokenOutput> {
    return this.oauth.refreshToken(refreshToken, region);
  }

  cancelFlow(): CancelFlowOutput {
    return this.oauth.cancelFlow();
  }
}

@injectable()
export class AuthSessionPortAdapter implements AuthSessionPort {
  constructor(
    @inject(MAIN_TOKENS.AuthSessionRepository)
    private readonly repository: IAuthSessionRepository,
  ) {}

  getCurrent(): AuthSessionRecord | null {
    const row = this.repository.getCurrent();
    if (!row) {
      return null;
    }
    return {
      refreshTokenEncrypted: row.refreshTokenEncrypted,
      cloudRegion: row.cloudRegion,
      selectedProjectId: row.selectedProjectId,
      scopeVersion: row.scopeVersion,
    };
  }

  saveCurrent(input: PersistAuthSessionRecord): void {
    this.repository.saveCurrent(input);
  }

  clearCurrent(): void {
    this.repository.clearCurrent();
  }
}

@injectable()
export class AuthPreferencePortAdapter implements AuthPreferencePort {
  constructor(
    @inject(MAIN_TOKENS.AuthPreferenceRepository)
    private readonly repository: IAuthPreferenceRepository,
  ) {}

  get(
    accountKey: string,
    cloudRegion: CloudRegion,
  ): AuthPreferenceRecord | null {
    const row = this.repository.get(accountKey, cloudRegion);
    if (!row) {
      return null;
    }
    return {
      accountKey: row.accountKey,
      cloudRegion: row.cloudRegion,
      lastSelectedProjectId: row.lastSelectedProjectId,
    };
  }

  save(input: AuthPreferenceRecord): void {
    this.repository.save(input);
  }
}

@injectable()
export class ConnectivityPortAdapter implements AuthConnectivityPort {
  constructor(
    @inject(MAIN_TOKENS.ConnectivityService)
    private readonly connectivity: ConnectivityService,
  ) {}

  getStatus(): ConnectivityStatus {
    return { isOnline: this.connectivity.getStatus().isOnline };
  }

  onStatusChange(handler: (status: ConnectivityStatus) => void): () => void {
    const listener = (status: { isOnline: boolean }) => {
      handler({ isOnline: status.isOnline });
    };
    this.connectivity.on(ConnectivityEvent.StatusChange, listener);
    return () => {
      this.connectivity.off(ConnectivityEvent.StatusChange, listener);
    };
  }
}
