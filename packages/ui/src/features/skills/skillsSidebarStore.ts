import { createSidebarStore } from "@posthog/ui/workbench/createSidebarStore";

export const useSkillsSidebarStore = createSidebarStore({
  name: "skills-sidebar",
  defaultWidth: 380,
});
