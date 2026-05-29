import "reflect-metadata";

import { ANALYTICS_SERVICE } from "@posthog/platform/analytics";
import { APP_LIFECYCLE_SERVICE } from "@posthog/platform/app-lifecycle";
import { APP_META_SERVICE } from "@posthog/platform/app-meta";
import { BUNDLED_RESOURCES_SERVICE } from "@posthog/platform/bundled-resources";
import { CLIPBOARD_SERVICE } from "@posthog/platform/clipboard";
import { CONTEXT_MENU_SERVICE } from "@posthog/platform/context-menu";
import { DEEP_LINK_SERVICE } from "@posthog/platform/deep-link";
import { DIALOG_SERVICE } from "@posthog/platform/dialog";
import { FILE_ICON_SERVICE } from "@posthog/platform/file-icon";
import { IMAGE_PROCESSOR_SERVICE } from "@posthog/platform/image-processor";
import { MAIN_WINDOW_SERVICE } from "@posthog/platform/main-window";
import { NOTIFIER_SERVICE } from "@posthog/platform/notifier";
import { POWER_MANAGER_SERVICE } from "@posthog/platform/power-manager";
import { SECURE_STORAGE_SERVICE } from "@posthog/platform/secure-storage";
import { STORAGE_PATHS_SERVICE } from "@posthog/platform/storage-paths";
import { UPDATER_SERVICE } from "@posthog/platform/updater";
import { URL_LAUNCHER_SERVICE } from "@posthog/platform/url-launcher";
import { WORKSPACE_SETTINGS_SERVICE } from "@posthog/platform/workspace-settings";
import { databaseModule } from "@posthog/workspace-server/db/db.module";
import {
  ARCHIVE_REPOSITORY,
  AUTH_PREFERENCE_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  DATABASE_SERVICE,
  DEFAULT_ADDITIONAL_DIRECTORY_REPOSITORY,
  REPOSITORY_REPOSITORY,
  SUSPENSION_REPOSITORY,
  WORKSPACE_REPOSITORY,
  WORKTREE_REPOSITORY,
} from "@posthog/workspace-server/db/identifiers";
import { repositoriesModule } from "@posthog/workspace-server/db/repositories.module";
import { PROCESS_TRACKING_SERVICE } from "@posthog/workspace-server/services/process-tracking/identifiers";
import { processTrackingModule } from "@posthog/workspace-server/services/process-tracking/process-tracking.module";
import { workspaceMetadataModule } from "@posthog/workspace-server/services/workspace-metadata/workspace-metadata.module";
import { contextMenuCoreModule } from "@posthog/core/context-menu/context-menu.module";
import {
  UPDATES_LOGGER,
  UPDATES_SERVICE,
} from "@posthog/core/updates/identifiers";
import { UPDATE_LIFECYCLE_PORT } from "@posthog/core/updates/lifecycle-port";
import { updatesCoreModule } from "@posthog/core/updates/updates.module";
import { CONTEXT_MENU_EXTERNAL_APPS_PORT } from "@posthog/core/context-menu/external-apps-port";
import { CONTEXT_MENU_CONTROLLER } from "@posthog/core/context-menu/identifiers";
import { Container } from "inversify";
import { ElectronAppLifecycle } from "../platform-adapters/electron-app-lifecycle";
import { ElectronAppMeta } from "../platform-adapters/electron-app-meta";
import { ElectronBundledResources } from "../platform-adapters/electron-bundled-resources";
import { ElectronClipboard } from "../platform-adapters/electron-clipboard";
import { CRYPTO_SERVICE } from "@posthog/platform/crypto";
import { ElectronCrypto } from "../platform-adapters/electron-crypto";
import { posthogNodeAnalytics } from "../platform-adapters/posthog-analytics";
import { ElectronContextMenu } from "../platform-adapters/electron-context-menu";
import { ElectronDialog } from "../platform-adapters/electron-dialog";
import { ElectronFileIcon } from "../platform-adapters/electron-file-icon";
import { ElectronImageProcessor } from "../platform-adapters/electron-image-processor";
import { ElectronMainWindow } from "../platform-adapters/electron-main-window";
import { ElectronNotifier } from "../platform-adapters/electron-notifier";
import { ElectronPowerManager } from "../platform-adapters/electron-power-manager";
import { ElectronSecureStorage } from "../platform-adapters/electron-secure-storage";
import { ElectronStoragePaths } from "../platform-adapters/electron-storage-paths";
import { ElectronUpdater } from "../platform-adapters/electron-updater";
import { ElectronUrlLauncher } from "../platform-adapters/electron-url-launcher";
import { ElectronWorkspaceSettings } from "../platform-adapters/electron-workspace-settings";
import { AgentAuthAdapter } from "../services/agent/auth-adapter";
import { AgentService } from "../services/agent/service";
import { osModule } from "@posthog/workspace-server/services/os/os.module";
import { AppLifecycleService } from "../services/app-lifecycle/service";
import { archiveModule } from "@posthog/workspace-server/services/archive/archive.module";
import {
  ARCHIVE_FILE_WATCHER,
  ARCHIVE_LOGGER,
  ARCHIVE_SESSION_CANCELLER,
} from "@posthog/workspace-server/services/archive/identifiers";
import type { FileWatcherBridge } from "../services/file-watcher/bridge";
import { WORKBENCH_LOGGER } from "@posthog/di/logger";
import {
  AUTH_CONNECTIVITY_PORT,
  AUTH_OAUTH_FLOW_PORT,
  AUTH_PREFERENCE_PORT,
  AUTH_SESSION_PORT,
  AUTH_TOKEN_CIPHER_PORT,
  AUTH_TOKEN_OVERRIDE,
} from "@posthog/core/auth/ports";
import { AuthService } from "../services/auth/service";
import {
  AuthPreferencePortAdapter,
  AuthSessionPortAdapter,
  ConnectivityPortAdapter,
  OAuthFlowPortAdapter,
  TokenCipherPortAdapter,
} from "../services/auth/port-adapters";
import { authProxyModule } from "@posthog/workspace-server/services/auth-proxy/auth-proxy.module";
import {
  AUTH_PROXY_AUTH,
  AUTH_PROXY_LOGGER,
} from "@posthog/workspace-server/services/auth-proxy/identifiers";
import { cloudTaskModule } from "@posthog/core/cloud-task/cloud-task.module";
import {
  CLOUD_TASK_AUTH,
  CLOUD_TASK_LOGGER,
  CLOUD_TASK_SERVICE,
} from "@posthog/core/cloud-task/identifiers";
import { DeepLinkService } from "../services/deep-link/service";
import { enrichmentModule } from "@posthog/workspace-server/services/enrichment/enrichment.module";
import {
  ENRICHMENT_AUTH,
  ENRICHMENT_FILE_READER,
  ENRICHMENT_LOGGER,
} from "@posthog/workspace-server/services/enrichment/identifiers";
import { stat as fsStat, readFile as fsReadFile } from "node:fs/promises";
import { listFilesContainingText } from "@posthog/git/queries";
import { externalAppsModule } from "@posthog/workspace-server/services/external-apps/external-apps.module";
import {
  EXTERNAL_APPS_SERVICE,
  EXTERNAL_APPS_STORE,
} from "@posthog/workspace-server/services/external-apps/identifiers";
import type { ExternalAppsPreferences } from "@posthog/workspace-server/services/external-apps/types";
import ExternalAppsStoreImpl from "electron-store";
import { getUserDataDir } from "../utils/env";
import { foldersModule } from "@posthog/workspace-server/services/folders/folders.module";
import { FOLDERS_LOGGER } from "@posthog/workspace-server/services/folders/identifiers";
import { GitService } from "../services/git/service";
import { GITHUB_INTEGRATION_LOGGER } from "@posthog/core/integrations/identifiers";
import { integrationsModule } from "@posthog/core/integrations/integrations.module";
import { HandoffService } from "../services/handoff/service";
import { InboxLinkService } from "@posthog/core/links/inbox-link";
import { llmGatewayModule } from "@posthog/core/llm-gateway/llm-gateway.module";
import {
  LLM_GATEWAY_AUTH,
  LLM_GATEWAY_ENDPOINTS,
  LLM_GATEWAY_LOGGER,
  LLM_GATEWAY_SERVICE,
} from "@posthog/core/llm-gateway/identifiers";
import { LlmGatewayService } from "@posthog/core/llm-gateway/llm-gateway";
import { DEFAULT_GATEWAY_MODEL } from "@posthog/agent/gateway-models";
import {
  getGatewayInvalidatePlanCacheUrl,
  getGatewayUsageUrl,
  getLlmGatewayUrl,
} from "@posthog/agent/posthog-api";
import { mcpAppsModule } from "@posthog/core/mcp-apps/mcp-apps.module";
import {
  MCP_APPS_LOGGER,
  MCP_APPS_SERVICE,
} from "@posthog/core/mcp-apps/identifiers";
import { mcpCallbackModule } from "@posthog/workspace-server/services/mcp-callback/mcp-callback.module";
import { MCP_CALLBACK_LOGGER } from "@posthog/workspace-server/services/mcp-callback/identifiers";
import { mcpProxyModule } from "@posthog/workspace-server/services/mcp-proxy/mcp-proxy.module";
import {
  MCP_PROXY_AUTH,
  MCP_PROXY_LOGGER,
} from "@posthog/workspace-server/services/mcp-proxy/identifiers";
import { NewTaskLinkService } from "@posthog/core/links/new-task-link";
import { NotificationService } from "@posthog/core/notification/notification";
import {
  NOTIFICATION_LOGGER,
  NOTIFICATION_SERVICE,
} from "@posthog/core/notification/identifiers";
import { oauthCallbackModule } from "@posthog/workspace-server/services/oauth-callback/oauth-callback.module";
import { OAUTH_CALLBACK_SERVER } from "@posthog/workspace-server/services/oauth-callback/identifiers";
import { oauthModule } from "@posthog/core/oauth/oauth.module";
import {
  OAUTH_CALLBACK,
  OAUTH_ENV,
  OAUTH_LOGGER,
} from "@posthog/core/oauth/identifiers";
import { isDevBuild } from "../utils/env";
import {
  POSTHOG_PLUGIN_LOGGER,
  POSTHOG_PLUGIN_SERVICE,
} from "@posthog/workspace-server/services/posthog-plugin/identifiers";
import { posthogPluginModule } from "@posthog/workspace-server/services/posthog-plugin/posthog-plugin.module";
import { ProvisioningService } from "@posthog/core/provisioning/provisioning";
import { settingsStore } from "../services/settingsStore";
import { logger } from "../utils/logger";
import { shellModule } from "@posthog/workspace-server/services/shell/shell.module";
import { SHELL_LOGGER } from "@posthog/workspace-server/services/shell/identifiers";
import { SLACK_INTEGRATION_LOGGER } from "@posthog/core/integrations/identifiers";
import { SleepService } from "@posthog/core/sleep/sleep";
import { SLEEP_LOGGER } from "@posthog/core/sleep/identifiers";
import { suspensionModule } from "@posthog/workspace-server/services/suspension/suspension.module";
import {
  SUSPENSION_FILE_WATCHER,
  SUSPENSION_LOGGER,
  SUSPENSION_SERVICE,
  SUSPENSION_SESSION_CANCELLER,
} from "@posthog/workspace-server/services/suspension/identifiers";
import { TaskLinkService } from "@posthog/core/links/task-link";
import {
  INBOX_LINK_LOGGER,
  NEW_TASK_LINK_LOGGER,
  TASK_LINK_LOGGER,
  TASK_LINK_SERVICE,
} from "@posthog/core/links/identifiers";
import { uiModule } from "@posthog/core/ui/ui.module";
import { UI_AUTH } from "@posthog/core/ui/identifiers";
import { usageMonitorModule } from "@posthog/core/usage/usage-monitor.module";
import {
  USAGE_ACTIVITY_MONITOR,
  USAGE_GATEWAY,
  USAGE_LOGGER,
  USAGE_THRESHOLD_STORE,
} from "@posthog/core/usage/identifiers";
import { AgentServiceEvent } from "../services/agent/schemas";
import { usageMonitorStore } from "../services/usage-monitor/store";
import {
  WATCHER_REGISTRY_LOGGER,
  WATCHER_REGISTRY_SERVICE,
} from "@posthog/workspace-server/services/watcher-registry/identifiers";
import { watcherRegistryModule } from "@posthog/workspace-server/services/watcher-registry/watcher-registry.module";
import { WorkspaceService } from "../services/workspace/service";
import { WorkspaceServerService } from "../services/workspace-server/service";
import { MAIN_TOKENS } from "./tokens";

export const container = new Container({
  defaultScope: "Singleton",
});

container.bind(URL_LAUNCHER_SERVICE).to(ElectronUrlLauncher);
container.bind(STORAGE_PATHS_SERVICE).to(ElectronStoragePaths);
container.bind(APP_META_SERVICE).to(ElectronAppMeta);
container.bind(DIALOG_SERVICE).to(ElectronDialog);
container.bind(CLIPBOARD_SERVICE).to(ElectronClipboard);
container.bind(CRYPTO_SERVICE).to(ElectronCrypto);
container.bind(ANALYTICS_SERVICE).toConstantValue(posthogNodeAnalytics);
container.bind(FILE_ICON_SERVICE).to(ElectronFileIcon);
container.bind(SECURE_STORAGE_SERVICE).to(ElectronSecureStorage);
container.bind(MAIN_WINDOW_SERVICE).to(ElectronMainWindow);
container.bind(APP_LIFECYCLE_SERVICE).to(ElectronAppLifecycle);
container.bind(POWER_MANAGER_SERVICE).to(ElectronPowerManager);
container.bind(UPDATER_SERVICE).to(ElectronUpdater);
container.bind(NOTIFIER_SERVICE).to(ElectronNotifier);
container.bind(CONTEXT_MENU_SERVICE).to(ElectronContextMenu);
container.bind(BUNDLED_RESOURCES_SERVICE).to(ElectronBundledResources);
container.bind(IMAGE_PROCESSOR_SERVICE).to(ElectronImageProcessor);
container.bind(WORKSPACE_SETTINGS_SERVICE).to(ElectronWorkspaceSettings);

// PORT NOTE: bridge to @posthog/workspace-server/db. The DB layer and its DI
// identifiers live in the workspace-server package (databaseModule owns
// DATABASE_SERVICE; repositoriesModule owns the per-repository identifiers).
// The MAIN_TOKENS.* aliases below bridge legacy apps/code consumers; retire each
// once its consumer injects the package identifier directly.
container.load(databaseModule, repositoriesModule);
container.bind(MAIN_TOKENS.DatabaseService).toService(DATABASE_SERVICE);
container
  .bind(MAIN_TOKENS.AuthPreferenceRepository)
  .toService(AUTH_PREFERENCE_REPOSITORY);
container
  .bind(MAIN_TOKENS.AuthSessionRepository)
  .toService(AUTH_SESSION_REPOSITORY);
container
  .bind(MAIN_TOKENS.RepositoryRepository)
  .toService(REPOSITORY_REPOSITORY);
container.bind(MAIN_TOKENS.WorkspaceRepository).toService(WORKSPACE_REPOSITORY);
container.bind(MAIN_TOKENS.WorktreeRepository).toService(WORKTREE_REPOSITORY);
container.bind(MAIN_TOKENS.ArchiveRepository).toService(ARCHIVE_REPOSITORY);
container
  .bind(MAIN_TOKENS.SuspensionRepository)
  .toService(SUSPENSION_REPOSITORY);
container
  .bind(MAIN_TOKENS.DefaultAdditionalDirectoryRepository)
  .toService(DEFAULT_ADDITIONAL_DIRECTORY_REPOSITORY);
container.bind(MAIN_TOKENS.AgentAuthAdapter).to(AgentAuthAdapter);
container.bind(MAIN_TOKENS.AgentService).to(AgentService);
// PORT NOTE: OsService (host OS ops: dialogs, attachments, image downscale,
// claude-settings read, dir search) moved to @posthog/workspace-server/services/os.
// Injects only platform services. Consumers inject OS_SERVICE directly.
container.load(osModule);
container.bind(WORKBENCH_LOGGER).toConstantValue(logger.scope("workbench"));
container.bind(AUTH_SESSION_PORT).to(AuthSessionPortAdapter);
container.bind(AUTH_PREFERENCE_PORT).to(AuthPreferencePortAdapter);
container.bind(AUTH_OAUTH_FLOW_PORT).to(OAuthFlowPortAdapter);
container.bind(AUTH_TOKEN_CIPHER_PORT).to(TokenCipherPortAdapter);
container.bind(AUTH_CONNECTIVITY_PORT).to(ConnectivityPortAdapter);
container
  .bind(AUTH_TOKEN_OVERRIDE)
  .toConstantValue(process.env.VITE_POSTHOG_ACCESS_TOKEN_OVERRIDE ?? null);
container.bind(MAIN_TOKENS.AuthService).to(AuthService);
// PORT NOTE: AuthProxyService (localhost LLM-gateway auth proxy) moved to
// @posthog/workspace-server/services/auth-proxy (host http.Server). Auth injected
// as a port. Retire MAIN_TOKENS.AuthProxyService once consumers inject AUTH_PROXY_SERVICE.
container.load(authProxyModule);
container.bind(AUTH_PROXY_AUTH).toDynamicValue((ctx) => ({
  authenticatedFetch: (url: string, init?: RequestInit) =>
    ctx
      .get<AuthService>(MAIN_TOKENS.AuthService)
      .authenticatedFetch(fetch, url, init),
}));
container.bind(AUTH_PROXY_LOGGER).toConstantValue(logger.scope("auth-proxy"));
// PORT NOTE: McpProxyService (localhost MCP auth-injecting proxy) moved to
// @posthog/workspace-server/services/mcp-proxy (host http.Server). Auth injected
// as a port. Retire MAIN_TOKENS.McpProxyService once consumers inject MCP_PROXY_SERVICE.
container.load(mcpProxyModule);
container.bind(MCP_PROXY_AUTH).toDynamicValue((ctx) => {
  const auth = () => ctx.get<AuthService>(MAIN_TOKENS.AuthService);
  return {
    authenticatedFetch: (url: string, init?: RequestInit) =>
      auth().authenticatedFetch(fetch, url, init),
    refreshAccessToken: () => auth().refreshAccessToken(),
  };
});
container.bind(MCP_PROXY_LOGGER).toConstantValue(logger.scope("mcp-proxy"));
// PORT NOTE: ArchiveService moved to @posthog/workspace-server/services/archive.
// Hosted here (single SQLite connection); session-cancel + file-watcher are
// narrow ports delegating to the apps/code AgentService + FileWatcherBridge;
// worktree location via WORKSPACE_SETTINGS_SERVICE. Retire MAIN_TOKENS.ArchiveService
// once consumers inject ARCHIVE_SERVICE.
container.load(archiveModule);
container.bind(ARCHIVE_SESSION_CANCELLER).toDynamicValue((ctx) => ({
  cancelSessionsByTaskId: (taskId: string) =>
    ctx
      .get<AgentService>(MAIN_TOKENS.AgentService)
      .cancelSessionsByTaskId(taskId),
}));
container.bind(ARCHIVE_FILE_WATCHER).toDynamicValue((ctx) => ({
  stopWatching: async (worktreePath: string) => {
    ctx
      .get<FileWatcherBridge>(MAIN_TOKENS.FileWatcherService)
      .stopWatching(worktreePath);
  },
}));
container.bind(ARCHIVE_LOGGER).toConstantValue(logger.scope("archive"));
// PORT NOTE: SuspensionService moved to @posthog/workspace-server/services/suspension.
// Hosted here (single SQLite conn); session-cancel + file-watcher are narrow ports
// delegating to apps/code AgentService + FileWatcherBridge; settings via
// WORKSPACE_SETTINGS_SERVICE. Retire MAIN_TOKENS.SuspensionService once consumers
// inject SUSPENSION_SERVICE. Last remaining consumer: WorkspaceService (@inject) —
// one-line retirement once workspace ports it.
container.load(suspensionModule);
container.bind(SUSPENSION_SESSION_CANCELLER).toDynamicValue((ctx) => ({
  cancelSessionsByTaskId: (taskId: string) =>
    ctx
      .get<AgentService>(MAIN_TOKENS.AgentService)
      .cancelSessionsByTaskId(taskId),
}));
container.bind(SUSPENSION_FILE_WATCHER).toDynamicValue((ctx) => ({
  stopWatching: async (worktreePath: string) => {
    ctx
      .get<FileWatcherBridge>(MAIN_TOKENS.FileWatcherService)
      .stopWatching(worktreePath);
  },
}));
container.bind(SUSPENSION_LOGGER).toConstantValue(logger.scope("suspension"));
container.bind(MAIN_TOKENS.SuspensionService).toService(SUSPENSION_SERVICE);
container.bind(MAIN_TOKENS.AppLifecycleService).to(AppLifecycleService);
// PORT NOTE: CloudTaskService (SSE streaming client for cloud task runs) moved to
// @posthog/core/cloud-task. Auth injected as a port to keep core host-neutral.
// Retire MAIN_TOKENS.CloudTaskService once consumers inject CLOUD_TASK_SERVICE.
// Last remaining consumer: HandoffService (@inject) — deferred with @posthog/agent.
container.load(cloudTaskModule);
container.bind(CLOUD_TASK_AUTH).toDynamicValue((ctx) => ({
  authenticatedFetch: (url: string, init?: RequestInit) =>
    ctx
      .get<AuthService>(MAIN_TOKENS.AuthService)
      .authenticatedFetch(fetch, url, init),
}));
container.bind(CLOUD_TASK_LOGGER).toConstantValue(logger.scope("cloud-task"));
container.bind(MAIN_TOKENS.CloudTaskService).toService(CLOUD_TASK_SERVICE);
// PORT NOTE: bridge to @posthog/core/context-menu. Menu-content orchestration
// moved to core (host-agnostic; consumes platform CONTEXT_MENU_SERVICE/DIALOG_SERVICE
// interfaces, not Electron). contextMenuCoreModule owns CONTEXT_MENU_CONTROLLER;
// MAIN_TOKENS.ContextMenuService aliases it for the context-menu router. The
// external-apps dependency is inverted: CONTEXT_MENU_EXTERNAL_APPS_PORT resolves to
// the main ExternalAppsService until external-apps migrates to a package service.
container.load(contextMenuCoreModule);
container
  .bind(CONTEXT_MENU_EXTERNAL_APPS_PORT)
  .toService(MAIN_TOKENS.ExternalAppsService);
container
  .bind(MAIN_TOKENS.ContextMenuService)
  .toService(CONTEXT_MENU_CONTROLLER);
container.bind(MAIN_TOKENS.DeepLinkService).to(DeepLinkService);
container.bind(DEEP_LINK_SERVICE).toService(MAIN_TOKENS.DeepLinkService);
// PORT NOTE: EnrichmentService lives in @posthog/workspace-server (it drives the
// @posthog/enricher native AST parsers + fs/git reads + PostHog HTTP API — all host
// I/O). Auth + fs/git reads injected as ports (ENRICHMENT_AUTH -> AuthService,
// ENRICHMENT_FILE_READER -> node fs + @posthog/git). Retire
// MAIN_TOKENS.EnrichmentService once consumers inject ENRICHMENT_SERVICE.
container.load(enrichmentModule);
container.bind(ENRICHMENT_AUTH).toDynamicValue((ctx) => {
  const auth = () => ctx.get<AuthService>(MAIN_TOKENS.AuthService);
  return {
    getState: () => {
      const state = auth().getState();
      return {
        status: state.status,
        projectId: state.projectId ?? null,
        cloudRegion: state.cloudRegion ?? null,
      };
    },
    getValidAccessToken: async () => {
      const token = await auth().getValidAccessToken();
      return { accessToken: token.accessToken, apiHost: token.apiHost };
    },
  };
});
container.bind(ENRICHMENT_FILE_READER).toConstantValue({
  stat: (p: string) => fsStat(p).then((s) => ({ size: s.size })),
  readFile: (p: string) => fsReadFile(p, "utf-8"),
  listFilesContainingText: (repoPath: string, text: string) =>
    listFilesContainingText(repoPath, text),
});
container
  .bind(ENRICHMENT_LOGGER)
  .toConstantValue(logger.scope("enrichment-service"));
container.bind(MAIN_TOKENS.ProvisioningService).to(ProvisioningService);

// PORT NOTE: ExternalAppsService moved to @posthog/workspace-server/services/external-apps
// (host I/O: app detection via fs + launching via child_process). Injects platform
// CLIPBOARD/FILE_ICON + an EXTERNAL_APPS_STORE port backed by the electron-store here.
// Retire MAIN_TOKENS.ExternalAppsService once consumers inject EXTERNAL_APPS_SERVICE.
const externalAppsPrefsStore = new ExternalAppsStoreImpl<{
  externalAppsPrefs: ExternalAppsPreferences;
}>({
  name: "external-apps",
  cwd: getUserDataDir(),
  defaults: { externalAppsPrefs: {} },
});
container.bind(EXTERNAL_APPS_STORE).toConstantValue({
  getPrefs: () => externalAppsPrefsStore.get("externalAppsPrefs"),
  setPrefs: (prefs: ExternalAppsPreferences) =>
    externalAppsPrefsStore.set("externalAppsPrefs", prefs),
});
container.load(externalAppsModule);
container
  .bind(MAIN_TOKENS.ExternalAppsService)
  .toService(EXTERNAL_APPS_SERVICE);
// PORT NOTE: LlmGatewayService moved to @posthog/core/llm-gateway. Core HTTP client
// over the PostHog LLM gateway; auth + gateway-endpoint URLs injected as ports to keep
// core @posthog/agent-free. Retire MAIN_TOKENS.LlmGatewayService once consumers inject
// LLM_GATEWAY_SERVICE. Last remaining consumer: GitService (@inject) — git agent plans
// a narrow GIT_LLM port, so leave this inject to them.
container.load(llmGatewayModule);
container.bind(LLM_GATEWAY_AUTH).toDynamicValue((ctx) => {
  const auth = () => ctx.get<AuthService>(MAIN_TOKENS.AuthService);
  return {
    getValidAccessToken: () => auth().getValidAccessToken(),
    authenticatedFetch: (url: string, init?: RequestInit) =>
      auth().authenticatedFetch(fetch, url, init),
  };
});
container.bind(LLM_GATEWAY_ENDPOINTS).toConstantValue({
  messagesUrl: (apiHost: string) => `${getLlmGatewayUrl(apiHost)}/v1/messages`,
  usageUrl: (apiHost: string) => getGatewayUsageUrl(apiHost),
  invalidatePlanCacheUrl: (apiHost: string) =>
    getGatewayInvalidatePlanCacheUrl(apiHost),
  defaultModel: DEFAULT_GATEWAY_MODEL,
});
container.bind(LLM_GATEWAY_LOGGER).toConstantValue(logger.scope("llm-gateway"));
container.bind(MAIN_TOKENS.LlmGatewayService).toService(LLM_GATEWAY_SERVICE);
// PORT NOTE: McpAppsService moved to @posthog/core/mcp-apps. Core orchestration
// (MCP HTTP connections, UI resource cache, tool discovery) over @modelcontextprotocol/sdk;
// only URL_LAUNCHER_SERVICE (platform) + a logger port injected. Retire
// MAIN_TOKENS.McpAppsService once consumers inject MCP_APPS_SERVICE. Last remaining
// consumer: AgentService (@inject) — deferred with @posthog/agent.
container.load(mcpAppsModule);
container
  .bind(MCP_APPS_LOGGER)
  .toConstantValue(logger.scope("mcp-apps-service"));
container.bind(MAIN_TOKENS.McpAppsService).toService(MCP_APPS_SERVICE);
// PORT NOTE: FoldersService moved to @posthog/workspace-server/services/folders.
// Hosted in this container (not the ws-server tRPC) so it shares the single
// SQLite connection; worktree location comes from WORKSPACE_SETTINGS_SERVICE and
// the host provides the logger port. Retire MAIN_TOKENS.FoldersService once
// consumers inject FOLDERS_SERVICE.
container.load(foldersModule);
container.bind(FOLDERS_LOGGER).toConstantValue(logger.scope("folders-service"));
// PORT NOTE: integration services (github/linear/slack) own host-agnostic OAuth
// authorize-flow + deep-link callback orchestration in @posthog/core/integrations.
// integrationsModule binds the three package services; apps/code binds only the
// host logger ports the github/slack services consume.
container.load(integrationsModule);
container
  .bind(GITHUB_INTEGRATION_LOGGER)
  .toConstantValue(logger.scope("github-integration-service"));
container.bind(MAIN_TOKENS.GitService).to(GitService);
container.bind(MAIN_TOKENS.HandoffService).to(HandoffService);
// PORT NOTE: the MCP-OAuth callback server AND its orchestrating service now
// live in @posthog/workspace-server/services/mcp-callback (MCP_CALLBACK_SERVER +
// MCP_CALLBACK_SERVICE; consumes platform DEEP_LINK/URL_LAUNCHER/APP_META +
// injected SagaLogger). mcpCallbackModule binds both; the mcp-callback router
// injects MCP_CALLBACK_SERVICE directly.
container.load(mcpCallbackModule);
container
  .bind(MCP_CALLBACK_LOGGER)
  .toConstantValue(logger.scope("mcp-callback"));
container.bind(NOTIFICATION_SERVICE).to(NotificationService);
container
  .bind(NOTIFICATION_LOGGER)
  .toConstantValue(logger.scope("notification"));
// PORT NOTE: OAuthService (flow orchestration) moved to @posthog/core/oauth; the dev
// HTTP callback server is in @posthog/workspace-server (OAUTH_CALLBACK_SERVER). Core
// OAuthService injects it via the OAUTH_CALLBACK port + OAUTH_ENV (isDev) + logger.
// Consumers (index bootstrap, oauth router, auth port-adapters) inject OAUTH_SERVICE.
container.load(oauthCallbackModule);
container.load(oauthModule);
container.bind(OAUTH_CALLBACK).toService(OAUTH_CALLBACK_SERVER);
container.bind(OAUTH_ENV).toConstantValue({ isDev: isDevBuild() });
container.bind(OAUTH_LOGGER).toConstantValue(logger.scope("oauth-service"));
// PORT NOTE: bridge to @posthog/workspace-server process-tracking. The service
// moved to the package (in-process keep, like the DB layer): its live-PID
// registry must stay in the main process where shell/agent/workspace spawn
// processes, so callers register/unregister synchronously. processTrackingModule
// owns PROCESS_TRACKING_SERVICE; MAIN_TOKENS.ProcessTrackingService aliases it so
// the 6 consumers are unchanged. Retire the alias once they inject the package
// identifier directly (and re-bind to the ws-server child when shell/agent move).
container.load(processTrackingModule);
container.load(workspaceMetadataModule);
container
  .bind(MAIN_TOKENS.ProcessTrackingService)
  .toService(PROCESS_TRACKING_SERVICE);
// PORT NOTE: bridge to @posthog/workspace-server posthog-plugin. The
// skills/plugin file-install capability (node:fs host ops) moved to ws-server
// (in-process keep), extends the @posthog/shared TypedEventEmitter, consumes
// platform STORAGE_PATHS/BUNDLED_RESOURCES/ANALYTICS/APP_META, and logs via an
// injected SagaLogger. Retire MAIN_TOKENS.PosthogPluginService once index/skills
// router/agent inject POSTHOG_PLUGIN_SERVICE directly.
container.load(posthogPluginModule);
container
  .bind(POSTHOG_PLUGIN_LOGGER)
  .toConstantValue(logger.scope("posthog-plugin"));
container
  .bind(MAIN_TOKENS.PosthogPluginService)
  .toService(POSTHOG_PLUGIN_SERVICE);
container.bind(MAIN_TOKENS.SleepService).to(SleepService);
container.bind(SLEEP_LOGGER).toConstantValue(logger.scope("sleep"));
// PORT NOTE: ShellService (node-pty terminal sessions) moved to
// @posthog/workspace-server/services/shell — pty is host state owned by ws-server.
// Injects ProcessTracking + repos + WORKSPACE_SETTINGS (worktree paths) + a logger
// port. Retire MAIN_TOKENS.ShellService once consumers inject SHELL_SERVICE.
container.load(shellModule);
container.bind(SHELL_LOGGER).toConstantValue(logger.scope("shell"));
container
  .bind(SLACK_INTEGRATION_LOGGER)
  .toConstantValue(logger.scope("slack-integration-service"));
// PORT NOTE: UIService (menu->renderer UI command event relay) moved to
// @posthog/core/ui. Auth injected as a narrow port (test-only token invalidation).
// Retire MAIN_TOKENS.UIService once consumers inject UI_SERVICE.
container.load(uiModule);
container.bind(UI_AUTH).toDynamicValue((ctx) => ({
  invalidateAccessTokenForTest: () =>
    ctx
      .get<AuthService>(MAIN_TOKENS.AuthService)
      .invalidateAccessTokenForTest(),
}));
// PORT NOTE: bridge to @posthog/core/updates. Update check/download/install
// orchestration moved to core (extends the @posthog/shared TypedEventEmitter;
// consumes platform UPDATER/APP_LIFECYCLE/APP_META/MAIN_WINDOW interfaces). The
// update-quit handoff is inverted behind UPDATE_LIFECYCLE_PORT -> the desktop
// AppLifecycleService; UPDATES_LOGGER -> the scoped electron logger. Retire the
// MAIN_TOKENS.UpdatesService alias once menu.ts/index.ts/router inject
// UPDATES_SERVICE directly.
container.load(updatesCoreModule);
container
  .bind(UPDATE_LIFECYCLE_PORT)
  .toService(MAIN_TOKENS.AppLifecycleService);
container.bind(UPDATES_LOGGER).toConstantValue(logger.scope("updates"));
container.bind(MAIN_TOKENS.UpdatesService).toService(UPDATES_SERVICE);
// PORT NOTE: UsageMonitorService moved to @posthog/core/usage. Core orchestration
// (coalesce/threshold/backstop) over narrow ports: USAGE_GATEWAY -> LlmGatewayService,
// USAGE_ACTIVITY_MONITOR -> AgentService LlmActivity events + active-session check,
// USAGE_THRESHOLD_STORE -> the electron usage-monitor store, USAGE_LOGGER -> scoped
// logger. Retire MAIN_TOKENS.UsageMonitorService once consumers inject USAGE_MONITOR_SERVICE.
container.load(usageMonitorModule);
container.bind(USAGE_GATEWAY).toDynamicValue((ctx) => ({
  fetchUsage: () =>
    ctx.get<LlmGatewayService>(MAIN_TOKENS.LlmGatewayService).fetchUsage(),
}));
container.bind(USAGE_ACTIVITY_MONITOR).toDynamicValue((ctx) => {
  const agent = () => ctx.get<AgentService>(MAIN_TOKENS.AgentService);
  return {
    onLlmActivity: (listener: () => void) =>
      agent().on(AgentServiceEvent.LlmActivity, listener),
    offLlmActivity: (listener: () => void) =>
      agent().off(AgentServiceEvent.LlmActivity, listener),
    hasActiveSessions: () => agent().hasActiveSessions(),
  };
});
container.bind(USAGE_THRESHOLD_STORE).toConstantValue({
  getThresholdsSeen: () => usageMonitorStore.get("thresholdsSeen", {}),
  setThresholdsSeen: (value: Record<string, string>) =>
    usageMonitorStore.set("thresholdsSeen", value),
});
container.bind(USAGE_LOGGER).toConstantValue(logger.scope("usage-monitor"));
container.bind(MAIN_TOKENS.TaskLinkService).to(TaskLinkService);
container.bind(TASK_LINK_SERVICE).toService(MAIN_TOKENS.TaskLinkService);
container
  .bind(TASK_LINK_LOGGER)
  .toConstantValue(logger.scope("task-link-service"));
container.bind(MAIN_TOKENS.InboxLinkService).to(InboxLinkService);
container
  .bind(INBOX_LINK_LOGGER)
  .toConstantValue(logger.scope("inbox-link-service"));
container.bind(MAIN_TOKENS.NewTaskLinkService).to(NewTaskLinkService);
container
  .bind(NEW_TASK_LINK_LOGGER)
  .toConstantValue(logger.scope("new-task-link-service"));
// PORT NOTE: bridge to @posthog/workspace-server watcher-registry (in-process
// keep; @parcel/watcher subscription registry is host state). Retire
// MAIN_TOKENS.WatcherRegistryService once app-lifecycle injects
// WATCHER_REGISTRY_SERVICE directly.
container.load(watcherRegistryModule);
container
  .bind(WATCHER_REGISTRY_LOGGER)
  .toConstantValue(logger.scope("watcher-registry"));
container
  .bind(MAIN_TOKENS.WatcherRegistryService)
  .toService(WATCHER_REGISTRY_SERVICE);
container.bind(MAIN_TOKENS.WorkspaceService).to(WorkspaceService);
container
  .bind(MAIN_TOKENS.WorkspaceServerService)
  .to(WorkspaceServerService)
  .inSingletonScope();

container.bind(MAIN_TOKENS.SettingsStore).toConstantValue(settingsStore);
