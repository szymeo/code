import { USAGE_MONITOR_SERVICE } from "@posthog/core/usage/identifiers";
import { container } from "../../di/container";
import type { UsageMonitorService } from "@posthog/core/usage/usage-monitor";
import {
  UsageMonitorEvent,
  type UsageMonitorEvents,
  usageSnapshotOutput,
} from "@posthog/core/usage/monitor-schemas";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<UsageMonitorService>(USAGE_MONITOR_SERVICE);

function subscribe<K extends keyof UsageMonitorEvents>(event: K) {
  return publicProcedure.subscription(async function* (opts) {
    const service = getService();
    const iterable = service.toIterable(event, { signal: opts.signal });
    for await (const data of iterable) {
      yield data;
    }
  });
}

export const usageMonitorRouter = router({
  onThresholdCrossed: subscribe(UsageMonitorEvent.ThresholdCrossed),
  onUsageUpdated: subscribe(UsageMonitorEvent.UsageUpdated),
  getLatest: publicProcedure
    .output(usageSnapshotOutput)
    .query(() => getService().getLatest()),
  refresh: publicProcedure
    .output(usageSnapshotOutput)
    .mutation(() => getService().refreshNow()),
});
