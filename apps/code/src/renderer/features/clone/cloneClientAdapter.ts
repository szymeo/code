import {
  type CloneClient,
  setCloneClient,
} from "@posthog/ui/features/clone/cloneClient";
import { trpcClient } from "@renderer/trpc/client";

// PORT NOTE: host adapter wiring the main electron-trpc git clone routes to the
// @posthog/ui CloneClient port so the UI cloneStore stays host-agnostic.
const cloneClient: CloneClient = {
  cloneRepository: async (input) => {
    await trpcClient.git.cloneRepository.mutate(input);
  },
  onCloneProgress: (onData) =>
    trpcClient.git.onCloneProgress.subscribe(undefined, { onData }),
};

setCloneClient(cloneClient);
