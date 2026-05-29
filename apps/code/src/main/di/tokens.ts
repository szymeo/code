/**
 * Main process DI tokens.
 *
 * IMPORTANT: These tokens are for main process only.
 * Never import this file from renderer code.
 */
export const MAIN_TOKENS = Object.freeze({
  // Workspace-server connection (typed client over the ELECTRON_RUN_AS_NODE child)
  WorkspaceClient: Symbol.for("Main.WorkspaceClient"),

  // Stores
  SettingsStore: Symbol.for("Main.SettingsStore"),

  // Database
  AuthPreferenceRepository: Symbol.for("Main.AuthPreferenceRepository"),
  DatabaseService: Symbol.for("Main.DatabaseService"),
  AuthSessionRepository: Symbol.for("Main.AuthSessionRepository"),
  RepositoryRepository: Symbol.for("Main.RepositoryRepository"),
  WorkspaceRepository: Symbol.for("Main.WorkspaceRepository"),
  WorktreeRepository: Symbol.for("Main.WorktreeRepository"),
  ArchiveRepository: Symbol.for("Main.ArchiveRepository"),
  SuspensionRepository: Symbol.for("Main.SuspensionRepository"),
  DefaultAdditionalDirectoryRepository: Symbol.for(
    "Main.DefaultAdditionalDirectoryRepository",
  ),

  // Services
  AgentAuthAdapter: Symbol.for("Main.AgentAuthAdapter"),
  AgentService: Symbol.for("Main.AgentService"),
  AuthService: Symbol.for("Main.AuthService"),
  SuspensionService: Symbol.for("Main.SuspensionService"),
  AppLifecycleService: Symbol.for("Main.AppLifecycleService"),
  CloudTaskService: Symbol.for("Main.CloudTaskService"),
  ConnectivityService: Symbol.for("Main.ConnectivityService"),
  ContextMenuService: Symbol.for("Main.ContextMenuService"),

  ExternalAppsService: Symbol.for("Main.ExternalAppsService"),
  LlmGatewayService: Symbol.for("Main.LlmGatewayService"),
  McpAppsService: Symbol.for("Main.McpAppsService"),
  FileWatcherService: Symbol.for("Main.FileWatcherService"),
  FocusService: Symbol.for("Main.FocusService"),
  FsService: Symbol.for("Main.FsService"),
  GitService: Symbol.for("Main.GitService"),
  HandoffService: Symbol.for("Main.HandoffService"),
  LocalLogsService: Symbol.for("Main.LocalLogsService"),
  DeepLinkService: Symbol.for("Main.DeepLinkService"),
  ProcessTrackingService: Symbol.for("Main.ProcessTrackingService"),
  SleepService: Symbol.for("Main.SleepService"),
  PosthogPluginService: Symbol.for("Main.PosthogPluginService"),
  UpdatesService: Symbol.for("Main.UpdatesService"),
  TaskLinkService: Symbol.for("Main.TaskLinkService"),
  InboxLinkService: Symbol.for("Main.InboxLinkService"),
  NewTaskLinkService: Symbol.for("Main.NewTaskLinkService"),
  WatcherRegistryService: Symbol.for("Main.WatcherRegistryService"),
  EnvironmentService: Symbol.for("Main.EnvironmentService"),
  ProvisioningService: Symbol.for("Main.ProvisioningService"),
  WorkspaceService: Symbol.for("Main.WorkspaceService"),
  WorkspaceServerService: Symbol.for("Main.WorkspaceServerService"),
});
