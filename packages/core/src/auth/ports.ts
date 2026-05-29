import type { CloudRegion } from "@posthog/shared";
import type {
  CancelFlowOutput,
  RefreshTokenOutput,
  StartFlowOutput,
} from "./oauth.schemas";

export interface AuthSessionRecord {
  refreshTokenEncrypted: string;
  cloudRegion: CloudRegion;
  selectedProjectId: number | null;
  scopeVersion: number;
}

export interface PersistAuthSessionRecord {
  refreshTokenEncrypted: string;
  cloudRegion: CloudRegion;
  selectedProjectId: number | null;
  scopeVersion: number;
}

export interface AuthPreferenceRecord {
  accountKey: string;
  cloudRegion: CloudRegion;
  lastSelectedProjectId: number | null;
}

/**
 * Persists the encrypted auth session. Desktop adapter wraps the
 * workspace-server AuthSessionRepository (drizzle rows mapped to the domain
 * record above so core never imports workspace-server).
 */
export interface AuthSessionPort {
  getCurrent(): AuthSessionRecord | null;
  saveCurrent(input: PersistAuthSessionRecord): void;
  clearCurrent(): void;
}

export const AUTH_SESSION_PORT = Symbol.for("posthog.core.auth.sessionPort");

/**
 * Persists per-account project preference. Desktop adapter wraps the
 * workspace-server AuthPreferenceRepository.
 */
export interface AuthPreferencePort {
  get(
    accountKey: string,
    cloudRegion: CloudRegion,
  ): AuthPreferenceRecord | null;
  save(input: AuthPreferenceRecord): void;
}

export const AUTH_PREFERENCE_PORT = Symbol.for(
  "posthog.core.auth.preferencePort",
);

/**
 * Drives the host OAuth login/refresh flow. Desktop adapter wraps the
 * Electron-coupled OAuthService (loopback callback server, deep links,
 * browser launch, window focus).
 */
export interface AuthOAuthFlowPort {
  startFlow(region: CloudRegion): Promise<StartFlowOutput>;
  startSignupFlow(region: CloudRegion): Promise<StartFlowOutput>;
  refreshToken(
    refreshToken: string,
    region: CloudRegion,
  ): Promise<RefreshTokenOutput>;
  cancelFlow(): CancelFlowOutput;
}

export const AUTH_OAUTH_FLOW_PORT = Symbol.for("posthog.core.auth.oauthFlow");

/**
 * Machine-bound symmetric cipher for the refresh token at rest. Desktop adapter
 * wraps the existing encryption util (node:crypto + machine id).
 */
export interface AuthTokenCipherPort {
  encrypt(plaintext: string): string;
  decrypt(encrypted: string): string | null;
}

export const AUTH_TOKEN_CIPHER_PORT = Symbol.for(
  "posthog.core.auth.tokenCipher",
);

export interface ConnectivityStatus {
  isOnline: boolean;
}

/**
 * Reports network connectivity so the session refresh can avoid pointless
 * offline attempts and recover when the network returns. Desktop adapter wraps
 * the ConnectivityService (workspace-server connectivity stream).
 */
export interface AuthConnectivityPort {
  getStatus(): ConnectivityStatus;
  onStatusChange(handler: (status: ConnectivityStatus) => void): () => void;
}

export const AUTH_CONNECTIVITY_PORT = Symbol.for(
  "posthog.core.auth.connectivity",
);

/**
 * Optional dev/test access-token override (host build env, e.g. Vite
 * VITE_POSTHOG_ACCESS_TOKEN_OVERRIDE). Injected as a value so core stays pure
 * (no process.env). Bind to null when unset.
 */
export const AUTH_TOKEN_OVERRIDE = Symbol.for(
  "posthog.core.auth.tokenOverride",
);
