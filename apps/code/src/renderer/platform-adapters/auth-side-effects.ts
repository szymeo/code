import type { CloudRegion } from "@posthog/shared";
import type { AuthSideEffects } from "@posthog/ui/features/auth/ports";
import { useAuthUiStateStore } from "@posthog/ui/features/auth/authUiStateStore";
import {
  clearAuthScopedQueries,
  refreshAuthStateQuery,
} from "@features/auth/hooks/authQueries";
import { useOnboardingStore } from "@posthog/ui/features/onboarding/onboardingStore";
import { resetSessionService } from "@features/sessions/service/service";
import { ANALYTICS_EVENTS } from "@shared/types/analytics";
import { useNavigationStore } from "@stores/navigationStore";
import { track } from "@utils/analytics";
import { injectable } from "inversify";

@injectable()
export class RendererAuthSideEffects implements AuthSideEffects {
  onAuthSuccess(region: CloudRegion, projectId: number | null): void {
    void refreshAuthStateQuery();
    useAuthUiStateStore.getState().clearStaleRegion();
    track(ANALYTICS_EVENTS.USER_LOGGED_IN, {
      project_id: projectId?.toString() ?? "",
      region,
    });
  }

  beforeProjectSwitch(): void {
    resetSessionService();
  }

  onProjectSelected(): void {
    clearAuthScopedQueries();
    void refreshAuthStateQuery();
    useNavigationStore.getState().navigateToTaskInput();
  }

  onLogout(previousRegion: CloudRegion | null): void {
    track(ANALYTICS_EVENTS.USER_LOGGED_OUT);
    resetSessionService();
    clearAuthScopedQueries();
    if (previousRegion) {
      useAuthUiStateStore.getState().setStaleRegion(previousRegion);
    }
    useNavigationStore.getState().navigateToTaskInput();
    useOnboardingStore.getState().resetSelections();
  }
}
