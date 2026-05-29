import type { SeatData } from "@posthog/shared";

export interface SubscriptionEventProps {
  plan_key: string;
  previous_plan_key?: string;
}

/**
 * Renderer client for host billing/seat operations (PostHog API via the
 * authenticated client + main-trpc plan-cache invalidation + analytics). The
 * desktop binds a concrete adapter; the seat store (a module zustand store, not
 * DI-resolved) reads it via configureBilling() set at boot.
 */
export interface BillingClient {
  getMySeat(options?: { best?: boolean }): Promise<SeatData | null>;
  createSeat(planKey: string): Promise<SeatData>;
  upgradeSeat(planKey: string): Promise<SeatData>;
  cancelSeat(): Promise<void>;
  reactivateSeat(): Promise<SeatData>;
  invalidatePlanCache(): void;
  trackSubscriptionStarted(props: SubscriptionEventProps): void;
  trackSubscriptionCancelled(props: SubscriptionEventProps): void;
}

export interface BillingLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

const noopLogger: BillingLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

let billingClient: BillingClient | null = null;
let billingLogger: BillingLogger = noopLogger;

export function configureBilling(
  client: BillingClient,
  logger: BillingLogger = noopLogger,
): void {
  billingClient = client;
  billingLogger = logger;
}

export function getBillingClient(): BillingClient {
  if (!billingClient) {
    throw new Error("Billing client not configured");
  }
  return billingClient;
}

export function getBillingLogger(): BillingLogger {
  return billingLogger;
}
