import { createSidebarStore } from "@posthog/ui/workbench/createSidebarStore";

export const useInboxSignalsSidebarStore = createSidebarStore({
  name: "inbox-signals-sidebar-storage",
  defaultWidth: 380,
  defaultOpen: false,
});
