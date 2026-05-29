export interface ContextMenuExternalApp {
  id: string;
  name: string;
  icon?: string;
}

export interface ContextMenuExternalAppsPort {
  getDetectedApps(): Promise<ContextMenuExternalApp[]>;
  getLastUsed(): Promise<{ lastUsedApp?: string }>;
}

export const CONTEXT_MENU_EXTERNAL_APPS_PORT = Symbol.for(
  "posthog.core.contextMenuExternalAppsPort",
);
