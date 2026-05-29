import { UI_SERVICE } from "@posthog/core/ui/identifiers";
import { container } from "../../di/container";
import { UIServiceEvent, type UIServiceEvents } from "@posthog/core/ui/schemas";
import type { UIService } from "@posthog/core/ui/ui";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<UIService>(UI_SERVICE);

function subscribeToUIEvent<K extends keyof UIServiceEvents>(event: K) {
  return publicProcedure.subscription(async function* (opts) {
    const service = getService();
    const iterable = service.toIterable(event, { signal: opts.signal });
    for await (const data of iterable) {
      yield data;
    }
  });
}

export const uiRouter = router({
  onOpenSettings: subscribeToUIEvent(UIServiceEvent.OpenSettings),
  onNewTask: subscribeToUIEvent(UIServiceEvent.NewTask),
  onResetLayout: subscribeToUIEvent(UIServiceEvent.ResetLayout),
  onClearStorage: subscribeToUIEvent(UIServiceEvent.ClearStorage),
  onInvalidateToken: subscribeToUIEvent(UIServiceEvent.InvalidateToken),
});
