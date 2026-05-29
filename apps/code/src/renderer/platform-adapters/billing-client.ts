import type { SeatData } from "@posthog/shared";
import type {
  BillingClient,
  SubscriptionEventProps,
} from "@posthog/ui/features/billing/ports";
import { getAuthenticatedClient } from "@features/auth/hooks/authClient";
import { trpcClient } from "@renderer/trpc";
import { ANALYTICS_EVENTS } from "@shared/types/analytics";
import { track } from "@utils/analytics";
import { queryClient } from "@utils/queryClient";

async function authedClient() {
  const client = await getAuthenticatedClient();
  if (!client) {
    throw new Error("Not authenticated");
  }
  return client;
}

export class RendererBillingClient implements BillingClient {
  async getMySeat(options?: { best?: boolean }): Promise<SeatData | null> {
    return (await authedClient()).getMySeat(options);
  }

  async createSeat(planKey: string): Promise<SeatData> {
    return (await authedClient()).createSeat(planKey);
  }

  async upgradeSeat(planKey: string): Promise<SeatData> {
    return (await authedClient()).upgradeSeat(planKey);
  }

  async cancelSeat(): Promise<void> {
    await (await authedClient()).cancelSeat();
  }

  async reactivateSeat(): Promise<SeatData> {
    return (await authedClient()).reactivateSeat();
  }

  invalidatePlanCache(): void {
    trpcClient.llmGateway.invalidatePlanCache.mutate().catch(() => {});
    void queryClient.invalidateQueries({ queryKey: [["llmGateway"]] });
  }

  trackSubscriptionStarted(props: SubscriptionEventProps): void {
    track(ANALYTICS_EVENTS.SUBSCRIPTION_STARTED, props);
  }

  trackSubscriptionCancelled(props: SubscriptionEventProps): void {
    track(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED, props);
  }
}
