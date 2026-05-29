import { getAuthIdentity, useAuthStore } from "@posthog/ui/features/auth/store";
import { trpc, trpcClient } from "@renderer/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@utils/queryClient";

// PORT NOTE: useCurrentUser/authKeys/AUTH_SCOPED_QUERY_META/getAuthIdentity now
// live in @posthog/ui/features/auth; re-exported here for existing importers.
export {
  AUTH_SCOPED_QUERY_META,
  authKeys,
  useCurrentUser,
} from "@posthog/ui/features/auth/useCurrentUser";
export { getAuthIdentity };

export type AuthState = Awaited<
  ReturnType<typeof trpcClient.auth.getState.query>
>;

export const ANONYMOUS_AUTH_STATE: AuthState = {
  status: "anonymous",
  bootstrapComplete: false,
  cloudRegion: null,
  projectId: null,
  availableProjectIds: [],
  availableOrgIds: [],
  hasCodeAccess: null,
  needsScopeReauth: false,
};

function getAuthStateQueryOptions() {
  return trpc.auth.getState.queryOptions();
}

export async function fetchAuthState(): Promise<AuthState> {
  return await trpcClient.auth.getState.query();
}

export function getCachedAuthState(): AuthState {
  return (
    queryClient.getQueryData<AuthState>(trpc.auth.getState.queryKey()) ??
    ANONYMOUS_AUTH_STATE
  );
}

export async function refreshAuthStateQuery(): Promise<void> {
  await queryClient.invalidateQueries(trpc.auth.getState.pathFilter());
}

export function clearAuthScopedQueries(): void {
  queryClient.removeQueries({
    predicate: (query) => query.meta?.authScoped === true,
  });
}

export function useAuthState() {
  return useQuery({
    ...getAuthStateQueryOptions(),
    placeholderData: ANONYMOUS_AUTH_STATE,
    refetchOnMount: true,
  });
}

export function useAuthStateFetched(): boolean {
  // PORT NOTE: store-backed via AuthContribution; bootstrapComplete is the
  // "auth resolved" signal (replaces the old query.isFetched).
  return useAuthStore((s) => s.authState.bootstrapComplete);
}

export function useAuthStateValue<T>(selector: (state: AuthState) => T): T {
  // PORT NOTE: reads the @posthog/ui auth store (fed by AuthContribution's
  // AUTH_CLIENT.onStateChanged subscription) instead of the local tRPC query,
  // so renderer auth-state access flows through the migrated store.
  return useAuthStore((s) => selector(s.authState as AuthState));
}
