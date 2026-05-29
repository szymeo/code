import {
  SeatPaymentFailedError,
  SeatSubscriptionRequiredError,
} from "@posthog/api-client/posthog-client";
import { PLAN_FREE, PLAN_PRO, type SeatData } from "@posthog/shared";
import { create } from "zustand";
import {
  type BillingClient,
  getBillingClient,
  getBillingLogger,
} from "./ports";

interface SeatStoreState {
  seat: SeatData | null;
  orgSeat: SeatData | null;
  isLoading: boolean;
  error: string | null;
  redirectUrl: string | null;
  billingOrgId: string | null;
}

interface SeatStoreActions {
  fetchSeat: (options?: { autoProvision?: boolean }) => Promise<void>;
  provisionFreeSeat: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  cancelSeat: () => Promise<void>;
  reactivateSeat: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type SeatStore = SeatStoreState & SeatStoreActions;

async function fetchAndProvision(
  client: BillingClient,
  options: { best: boolean; autoProvision: boolean },
): Promise<SeatData | null> {
  const log = getBillingLogger();
  let seat = await client.getMySeat({ best: options.best });
  if (!seat && options.autoProvision) {
    log.info("No seat found, auto-provisioning free plan", {
      best: options.best,
    });
    try {
      seat = await client.createSeat(PLAN_FREE);
    } catch {
      log.info("Auto-provision failed, re-fetching seat");
      seat = await client.getMySeat({ best: options.best });
    }
  }
  return seat;
}

function handleSeatError(
  error: unknown,
  set: (state: Partial<SeatStoreState>) => void,
): void {
  const log = getBillingLogger();
  if (!(error instanceof Error)) {
    log.error("Seat operation failed", error);
    set({ isLoading: false, error: "An unexpected error occurred" });
    return;
  }

  if (error instanceof SeatSubscriptionRequiredError) {
    set({
      isLoading: false,
      error: "Billing subscription required",
      redirectUrl: error.redirectUrl,
    });
    return;
  }

  if (error instanceof SeatPaymentFailedError) {
    set({ isLoading: false, error: error.message });
    return;
  }

  log.error("Seat operation failed", error);
  set({ isLoading: false, error: error.message });
}

const initialState: SeatStoreState = {
  seat: null,
  orgSeat: null,
  isLoading: false,
  error: null,
  redirectUrl: null,
  billingOrgId: null,
};

export const useSeatStore = create<SeatStore>()((set, get) => ({
  ...initialState,

  fetchSeat: async (options?: { autoProvision?: boolean }) => {
    set({ isLoading: true, error: null, redirectUrl: null });
    try {
      const client = getBillingClient();
      const autoProvision = options?.autoProvision ?? false;
      const [seat, orgSeat] = await Promise.all([
        fetchAndProvision(client, { best: true, autoProvision }),
        fetchAndProvision(client, { best: false, autoProvision }),
      ]);
      set({
        seat,
        orgSeat,
        isLoading: false,
        billingOrgId: seat?.organization_id ?? null,
      });
    } catch (error) {
      const { seat: existingSeat } = get();
      if (existingSeat) {
        getBillingLogger().warn(
          "fetchSeat failed but seat already loaded, keeping it",
          error,
        );
        set({ isLoading: false });
        return;
      }
      handleSeatError(error, set);
    }
  },

  provisionFreeSeat: async () => {
    const log = getBillingLogger();
    log.info("Provisioning free seat");
    set({ isLoading: true, error: null, redirectUrl: null });
    try {
      const client = getBillingClient();
      const existing = await client.getMySeat();
      if (existing) {
        log.info("Seat already exists on server", {
          plan: existing.plan_key,
          status: existing.status,
        });
        set({
          seat: existing,
          isLoading: false,
          billingOrgId: existing.organization_id ?? null,
        });
        return;
      }
      const seat = await client.createSeat(PLAN_FREE);
      log.info("Free seat created", { id: seat.id, plan: seat.plan_key });
      set({
        seat,
        isLoading: false,
        billingOrgId: seat.organization_id ?? null,
      });
      client.invalidatePlanCache();
    } catch (error) {
      log.error("provisionFreeSeat failed", error);
      handleSeatError(error, set);
    }
  },

  upgradeToPro: async () => {
    set({ isLoading: true, error: null, redirectUrl: null });
    try {
      const client = getBillingClient();
      const existing = await client.getMySeat();
      if (existing) {
        if (existing.plan_key === PLAN_PRO) {
          set({
            seat: existing,
            isLoading: false,
            billingOrgId: existing.organization_id ?? null,
          });
          return;
        }
        const seat = await client.upgradeSeat(PLAN_PRO);
        set({
          seat,
          orgSeat: seat,
          isLoading: false,
          billingOrgId: seat.organization_id ?? null,
        });
        client.trackSubscriptionStarted({
          plan_key: seat.plan_key,
          previous_plan_key: existing.plan_key,
        });
        client.invalidatePlanCache();
        return;
      }
      const seat = await client.createSeat(PLAN_PRO);
      set({
        seat,
        orgSeat: seat,
        isLoading: false,
        billingOrgId: seat.organization_id ?? null,
      });
      client.trackSubscriptionStarted({ plan_key: seat.plan_key });
      client.invalidatePlanCache();
    } catch (error) {
      handleSeatError(error, set);
    }
  },

  cancelSeat: async () => {
    set({ isLoading: true, error: null, redirectUrl: null });
    try {
      const client = getBillingClient();
      const previousPlanKey = get().seat?.plan_key;
      await client.cancelSeat();
      const seat = await client.getMySeat();
      set({
        seat,
        orgSeat: seat,
        isLoading: false,
        billingOrgId: seat?.organization_id ?? null,
      });
      const cancelledPlanKey = previousPlanKey ?? seat?.plan_key;
      if (cancelledPlanKey) {
        client.trackSubscriptionCancelled({ plan_key: cancelledPlanKey });
      }
      client.invalidatePlanCache();
    } catch (error) {
      handleSeatError(error, set);
    }
  },

  reactivateSeat: async () => {
    set({ isLoading: true, error: null, redirectUrl: null });
    try {
      const client = getBillingClient();
      const seat = await client.reactivateSeat();
      set({
        seat,
        orgSeat: seat,
        isLoading: false,
        billingOrgId: seat.organization_id ?? null,
      });
      client.invalidatePlanCache();
    } catch (error) {
      handleSeatError(error, set);
    }
  },

  clearError: () => set({ error: null, redirectUrl: null }),

  reset: () => set(initialState),
}));
