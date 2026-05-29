import {
  type ConnectivityClient,
  setConnectivityClient,
} from "@posthog/ui/features/connectivity/connectivityClient";
import { trpcClient } from "@renderer/trpc/client";

// PORT NOTE: host adapter wiring the main electron-trpc connectivity routes to
// the @posthog/ui ConnectivityClient port.
const connectivityClient: ConnectivityClient = {
  checkNow: () => trpcClient.connectivity.checkNow.mutate(),
  getStatus: () => trpcClient.connectivity.getStatus.query(),
  onStatusChange: (handlers) =>
    trpcClient.connectivity.onStatusChange.subscribe(undefined, handlers),
};

setConnectivityClient(connectivityClient);
