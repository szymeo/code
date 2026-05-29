import type { WorkbenchContribution } from "@posthog/di/contribution";
import { inject, injectable } from "inversify";
import { AUTH_CLIENT, type AuthClient } from "./ports";
import { useAuthStore } from "./store";

@injectable()
export class AuthContribution implements WorkbenchContribution {
  constructor(
    @inject(AUTH_CLIENT)
    private readonly auth: AuthClient,
  ) {}

  async start(): Promise<void> {
    this.auth.onStateChanged((state) => {
      useAuthStore.getState().setAuthState(state);
    });

    const initial = await this.auth.getState();
    useAuthStore.getState().setAuthState(initial);
  }
}
