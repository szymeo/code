import { useService } from "@posthog/di/react";
import { PostHogAPIClient } from "@posthog/api-client/posthog-client";
import type { AuthState } from "@posthog/core/auth/schemas";
import { getCloudUrlFromRegion, NotAuthenticatedError } from "@posthog/shared";
import { useMemo } from "react";
import { AUTH_CLIENT, type AuthClient } from "./ports";
import { useAuthStateValue } from "./store";

export function createAuthenticatedClient(
  authState: AuthState | null | undefined,
  getValidAccessToken: () => Promise<string>,
  refreshAccessToken: () => Promise<string>,
): PostHogAPIClient | null {
  if (authState?.status !== "authenticated" || !authState.cloudRegion) {
    return null;
  }

  const client = new PostHogAPIClient(
    getCloudUrlFromRegion(authState.cloudRegion),
    getValidAccessToken,
    refreshAccessToken,
    authState.projectId ?? undefined,
  );

  if (authState.projectId) {
    client.setTeamId(authState.projectId);
  }

  return client;
}

function tokenAccessors(auth: AuthClient) {
  return {
    getValidAccessToken: () =>
      auth.getValidAccessToken().then((r) => r.accessToken),
    refreshAccessToken: () =>
      auth.refreshAccessToken().then((r) => r.accessToken),
  };
}

export function useOptionalAuthenticatedClient(): PostHogAPIClient | null {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const authState = useAuthStateValue((state) => state);

  return useMemo(() => {
    const { getValidAccessToken, refreshAccessToken } = tokenAccessors(auth);
    return createAuthenticatedClient(
      authState,
      getValidAccessToken,
      refreshAccessToken,
    );
  }, [
    authState.cloudRegion,
    authState.projectId,
    authState.status,
    authState,
    auth,
  ]);
}

export function useAuthenticatedClient(): PostHogAPIClient {
  const client = useOptionalAuthenticatedClient();

  if (!client) {
    throw new NotAuthenticatedError();
  }

  return client;
}
