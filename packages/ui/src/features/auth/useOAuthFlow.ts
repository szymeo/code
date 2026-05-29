import { useService } from "@posthog/di/react";
import type { CloudRegion } from "@posthog/shared";
import { useState } from "react";
import { useAuthUiStateStore } from "./authUiStateStore";
import { AUTH_CLIENT, type AuthClient } from "./ports";
import { useLoginMutation } from "./useAuthMutations";

export function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }
  if (!(error instanceof Error)) {
    return "Failed to authenticate";
  }
  const message = error.message;

  if (message === "2FA_REQUIRED") {
    return null; // 2FA dialog will handle this
  }

  if (message.includes("access_denied")) {
    return "Authorization cancelled.";
  }

  if (message.includes("timed out")) {
    return "Authorization timed out. Please try again.";
  }

  if (message.includes("SSO login required")) {
    return message;
  }

  return message;
}

export function useOAuthFlow() {
  const auth = useService<AuthClient>(AUTH_CLIENT);
  const staleRegion = useAuthUiStateStore((s) => s.staleRegion);
  const [region, setRegion] = useState<CloudRegion>(staleRegion ?? "us");
  const loginMutation = useLoginMutation();

  const handleAuth = () => {
    loginMutation.mutate(region);
  };

  const handleRegionChange = (value: CloudRegion) => {
    setRegion(value);
    loginMutation.reset();
  };

  const handleCancel = async () => {
    loginMutation.reset();
    await auth.cancelOAuthFlow();
  };

  return {
    region,
    handleAuth,
    handleRegionChange,
    handleCancel,
    isPending: loginMutation.isPending,
    errorMessage: getErrorMessage(loginMutation.error),
  };
}
