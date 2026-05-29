import {
  electronStorage,
  setRendererStorage,
} from "@posthog/ui/workbench/rendererStorage";
import type { StateStorage } from "zustand/middleware";
import { trpcClient } from "../trpc";

// PORT NOTE: the host (apps/code) owns the electron-trpc-backed raw storage and
// registers it with @posthog/ui's renderer storage at module load. Stores in
// packages/ui import `electronStorage` from @posthog/ui/workbench/rendererStorage
// directly. This shim re-exports it so existing @utils/electronStorage consumers
// keep working; retire it once they repoint to @posthog/ui.
const electronStorageRaw: StateStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return await trpcClient.secureStore.getItem.query({ key });
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await trpcClient.secureStore.setItem.query({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await trpcClient.secureStore.removeItem.query({ key });
  },
};

setRendererStorage(electronStorageRaw);

export { electronStorage };
