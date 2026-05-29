import { useService } from "@posthog/di/react";
import type { CloudRegion } from "@posthog/shared";
import { useMutation } from "@tanstack/react-query";
import {
  AUTH_CLIENT,
  AUTH_SIDE_EFFECTS,
  type AuthClient,
  type AuthSideEffects,
} from "./ports";

export function useLoginMutation() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const fx = useService<AuthSideEffects>(AUTH_SIDE_EFFECTS);
  return useMutation({
    mutationFn: (region: CloudRegion) => auth.login(region),
    onSuccess: (state, region) => fx.onAuthSuccess(region, state.projectId),
  });
}

export function useSignupMutation() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const fx = useService<AuthSideEffects>(AUTH_SIDE_EFFECTS);
  return useMutation({
    mutationFn: (region: CloudRegion) => auth.signup(region),
    onSuccess: (state, region) => fx.onAuthSuccess(region, state.projectId),
  });
}

export function useSelectProjectMutation() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const fx = useService<AuthSideEffects>(AUTH_SIDE_EFFECTS);
  return useMutation({
    mutationFn: (projectId: number) => {
      fx.beforeProjectSwitch();
      return auth.selectProject(projectId);
    },
    onSuccess: () => fx.onProjectSelected(),
  });
}

export function useRedeemInviteCodeMutation() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  return useMutation({
    mutationFn: (code: string) => auth.redeemInviteCode(code),
  });
}

export function useLogoutMutation() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const fx = useService<AuthSideEffects>(AUTH_SIDE_EFFECTS);
  return useMutation({
    mutationFn: async () => {
      const previous = await auth.getState();
      await auth.logout();
      return previous;
    },
    onSuccess: (previous) => fx.onLogout(previous.cloudRegion),
  });
}
