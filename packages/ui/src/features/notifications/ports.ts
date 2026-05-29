export interface NotificationSettings {
  desktopNotifications: boolean;
  dockBadgeNotifications: boolean;
  dockBounceNotifications: boolean;
  completionSound: string;
  completionVolume: number;
}

export interface NotificationSettingsPort {
  get(): NotificationSettings;
}

export const NOTIFICATION_SETTINGS_PORT = Symbol.for(
  "posthog.ui.notifications.settings",
);

export interface ActiveViewPort {
  hasFocus(): boolean;
  getActiveTaskId(): string | undefined;
}

export const ACTIVE_VIEW_PORT = Symbol.for(
  "posthog.ui.notifications.activeView",
);

export interface CompletionSoundPort {
  play(sound: string, volume: number): void;
}

export const COMPLETION_SOUND_PORT = Symbol.for(
  "posthog.ui.notifications.sound",
);
