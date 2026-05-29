import {
  getUpdatesClient,
  type UpdateStatusPayload,
} from "@posthog/ui/features/updates/updatesClient";
import { logger } from "@posthog/ui/workbench/logger";
import { toast } from "../../primitives/toast";
import { create } from "zustand";

const log = logger.scope("update-store");

type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "installing";

interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  isEnabled: boolean;
  menuCheckPending: boolean;

  installUpdate: () => Promise<void>;
  checkForUpdates: () => void;
}

export const useUpdateStore = create<UpdateState>()((set, get) => ({
  status: "idle",
  version: null,
  isEnabled: false,
  menuCheckPending: false,

  installUpdate: async () => {
    if (get().status === "installing") return;

    set({ status: "installing" });

    try {
      const result = await getUpdatesClient().install();
      if (!result.installed) {
        log.error("Update install returned not installed");
        set({ status: "ready" });
      }
    } catch (error) {
      log.error("Failed to install update", { error });
      set({ status: "ready" });
    }
  },

  checkForUpdates: () => {
    getUpdatesClient()
      .check()
      .catch((error: unknown) => {
        log.error("Failed to check for updates", { error });
      });
  },
}));

export function initializeUpdateStore() {
  getUpdatesClient()
    .isEnabled()
    .then((result) => {
      useUpdateStore.setState({ isEnabled: result.enabled });
    })
    .catch((error: unknown) => {
      log.error("Failed to get update enabled status", { error });
    });

  getUpdatesClient()
    .getStatus()
    .then((status) => {
      applyStatus(status);
    })
    .catch((error: unknown) => {
      log.error("Failed to get update status", { error });
    });

  const statusSub = getUpdatesClient().onStatus({
    onData: (status) => {
      applyStatus(status);

      if (status.upToDate) {
        if (useUpdateStore.getState().menuCheckPending) {
          useUpdateStore.setState({ menuCheckPending: false });
          toast.success("You're on the latest version");
        }
      } else if (status.error) {
        log.error("Update check failed", { error: status.error });
        if (useUpdateStore.getState().menuCheckPending) {
          useUpdateStore.setState({ menuCheckPending: false });
          toast.error("Failed to check for updates", {
            description: status.error,
          });
        }
      } else if (
        status.checking === false &&
        useUpdateStore.getState().menuCheckPending
      ) {
        // Check finished and an update was found (download in progress / ready)
        // — the UpdateBanner will surface it, so suppress the menu-check toast.
        useUpdateStore.setState({ menuCheckPending: false });
      }
    },
    onError: (error) => {
      log.error("Update status subscription error", { error });
      useUpdateStore.setState({ menuCheckPending: false });
    },
  });

  const readySub = getUpdatesClient().onReady({
    onData: (data) => {
      useUpdateStore.setState({
        status: "ready",
        version: data.version,
      });
    },
    onError: (error) => {
      log.error("Update ready subscription error", { error });
    },
  });

  const menuCheckSub = getUpdatesClient().onCheckFromMenu({
    onData: () => {
      useUpdateStore.setState({ menuCheckPending: true });
      getUpdatesClient()
        .check()
        .then((result) => {
          if (!result.success) {
            if (result.errorCode === "disabled") {
              useUpdateStore.setState({ menuCheckPending: false });
              toast.error(result.errorMessage ?? "Updates not available");
            } else if (result.errorCode !== "already_checking") {
              // Unknown/future error code — reset the flag so it never gets stuck.
              useUpdateStore.setState({ menuCheckPending: false });
            }
            // For "already_checking", keep the flag so the in-flight check
            // surfaces the toast when it resolves.
          }
        })
        .catch((error: unknown) => {
          useUpdateStore.setState({ menuCheckPending: false });
          log.error("Failed to check for updates", { error });
          toast.error("Failed to check for updates");
        });
    },
    onError: (error) => {
      log.error("Update menu check subscription error", { error });
    },
  });

  return () => {
    statusSub.unsubscribe();
    readySub.unsubscribe();
    menuCheckSub.unsubscribe();
  };
}

function applyStatus(status: UpdateStatusPayload): void {
  if (status.installing) {
    useUpdateStore.setState({
      status: "installing",
      version: status.version ?? null,
    });
    return;
  }

  if (status.updateReady) {
    useUpdateStore.setState({
      status: "ready",
      version: status.version ?? null,
    });
    return;
  }

  if (status.checking && status.downloading) {
    useUpdateStore.setState({ status: "downloading" });
    return;
  }

  if (status.checking) {
    useUpdateStore.setState({ status: "checking" });
    return;
  }

  if (status.upToDate || status.error) {
    const current = useUpdateStore.getState().status;
    if (current !== "ready" && current !== "installing") {
      useUpdateStore.setState({ status: "idle" });
    }
  }
}
