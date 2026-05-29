// PORT NOTE: hooks + builder live in @posthog/ui/features/auth/authClient.
// This app module keeps the 1-arg createAuthenticatedClient(authState) +
// getAuthenticatedClient() helpers (used by non-React renderer services) by
// supplying trpcClient-backed token accessors to the package builder.
import { createAuthenticatedClient as createClient } from "@posthog/ui/features/auth/authClient";
import type { PostHogAPIClient } from "@posthog/api-client/posthog-client";
import { trpcClient } from "@renderer/trpc/client";
import { type AuthState, fetchAuthState } from "./authQueries";

export {
  useAuthenticatedClient,
  useOptionalAuthenticatedClient,
} from "@posthog/ui/features/auth/authClient";

async function getValidAccessToken(): Promise<string> {
  const { accessToken } = await trpcClient.auth.getValidAccessToken.query();
  return accessToken;
}

async function refreshAccessToken(): Promise<string> {
  const { accessToken } = await trpcClient.auth.refreshAccessToken.mutate();
  return accessToken;
}

export function createAuthenticatedClient(
  authState: AuthState | null | undefined,
): PostHogAPIClient | null {
  return createClient(authState, getValidAccessToken, refreshAccessToken);
}

export async function getAuthenticatedClient(): Promise<PostHogAPIClient | null> {
  return createAuthenticatedClient(await fetchAuthState());
}
