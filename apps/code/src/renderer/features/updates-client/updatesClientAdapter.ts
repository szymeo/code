import {
  setUpdatesClient,
  type UpdatesClient,
} from "@posthog/ui/features/updates/updatesClient";
import { trpcClient } from "@renderer/trpc/client";

// PORT NOTE: host adapter wiring the main electron-trpc updates routes to the
// @posthog/ui UpdatesClient port.
const updatesClient: UpdatesClient = {
  install: () => trpcClient.updates.install.mutate(),
  check: () => trpcClient.updates.check.mutate(),
  isEnabled: () => trpcClient.updates.isEnabled.query(),
  getStatus: () => trpcClient.updates.getStatus.query(),
  onStatus: (sub) => trpcClient.updates.onStatus.subscribe(undefined, sub),
  onReady: (sub) =>
    trpcClient.updates.onReady.subscribe(undefined, {
      onData: (data) => sub.onData({ version: data.version }),
      onError: sub.onError,
    }),
  onCheckFromMenu: (sub) =>
    trpcClient.updates.onCheckFromMenu.subscribe(undefined, {
      onData: () => sub.onData(),
      onError: sub.onError,
    }),
};

setUpdatesClient(updatesClient);
