# MIGRATION.md — landed slice log

Running log of what moved and where. Ten lines per entry max.

For the procedure to follow when porting a new feature, see [REFACTOR.md](./REFACTOR.md).

## 2026-05-30 — OAuth + integrations + McpCallback + Notification retirements (6 more MAIN_TOKENS removed)

- Retired MAIN_TOKENS.OAuthService: already package-canonical (`.toService(OAUTH_SERVICE)`); repointed the 3 consumers (index bootstrap, oauth router, auth `OAuthFlowPortAdapter` @inject) to OAUTH_SERVICE, deleted bridge + token.
- Ported the integration services off `MAIN_TOKENS → .to(class)` to package-canonical identifiers: added GITHUB_INTEGRATION_SERVICE / LINEAR_INTEGRATION_SERVICE / SLACK_INTEGRATION_SERVICE to `packages/core/src/integrations/identifiers.ts`, bound the core classes to them, repointed consumers (github/linear/slack routers + index), removed the 3 tokens. No bridge needed (all consumers host-level).
- Retired MAIN_TOKENS.McpCallbackService: repointed the mcp-callback router to the existing MCP_CALLBACK_SERVICE, deleted the `.toService` bridge + token.
- Ported NotificationService to a package identifier: added NOTIFICATION_SERVICE to `packages/core/src/notification/identifiers.ts`, bound the core class to it, repointed consumers (notification router + index), removed the token.
- 15 MAIN_TOKENS service tokens retired this session. Validation: core + apps/code typecheck 0 errors; core notification test 8/8; full `pnpm typecheck` 19/19.
- Completed the integrations registration module: added `packages/core/src/integrations/integrations.module.ts` (binds GITHUB/LINEAR/SLACK_INTEGRATION_SERVICE, singleton) per REFACTOR.md "Registration Modules"; apps/code container now `container.load(integrationsModule)` + binds only the host logger ports, instead of three inline `.to(class)` binds. Lets a future web/mobile host load integrations without app-local wiring. core + my apps/code files: 0 errors.
## 2026-05-30 — host-consumer repointing + validation campaign

- Repointed the host-side consumers of the 4 remaining bridges to package identifiers: llm-gateway/cloud-task/suspension/mcp-apps routers + menu.ts (McpApps) + index.ts (Suspension) now `container.get(<PACKAGE_ID>)`. Each bridge now has exactly ONE consumer left (the off-limits tangle inject: Git/Handoff/Workspace/Agent) — annotated in container.ts so the final retirement is a one-liner.
- Validation campaign: ran package test suites. core 210 passing; ws-server pass except the better-sqlite3 DB round-trip (Electron-ABI NODE_MODULE_VERSION 145 vs 137 — environmental, not code). Promoted 16 needs_validation slices to passing with per-slice evidence: connectivity, environments, folders, archive, suspension, usage-monitor, cloud-task, enrichment, fs-capability, local-logs-capability, llm-gateway, notifications, os, github-integration, slack-integration, linear-integration.
- Authored 9 new test suites (83 tests): core llm-gateway (prompt/usage/invalidate + timeout), oauth (refreshToken status->errorCode, cancelFlow, deep-link refocus), task-link (path/run-id/queue/focus), notification (click-navigate + dock badge lifecycle), integrations github + slack (startFlow url/timeout, callback parsing incl non-numeric ids, queue/consume, timeout-cancel) + linear (authorize url + error wrap); ws-server os (showMessageBox mapping, dialog-port pickers, getClaudePermissions parse), workspace-metadata (togglePin/markViewed/markActivity-clamp + projections — annotates the in_progress workspace slice); shared backoff (getBackoffDelay exponential + cap, sleepWithBackoff timing) + regions (getCloudUrlFromRegion, getOauthClientIdFromRegion distinct-per-region, formatRegionBadge) + errors (auth/rate-limit/fatal-session classification incl rate-limit-precedence) + xml (escape/unescape round-trip). 13 suites total (~96 tests), all green; shared 277/277, core 210+, ws-server pass (modulo DB-ABI). auth slice annotated: oauth is test-backed, blocked only on agent coupling.
- Mid-turn convergence with concurrent agents: adapted oauth.test.ts to a newly-added 7th constructor param (CRYPTO_SERVICE / @posthog/platform/crypto port another agent extracted); rode out transient updates.ts / updates.test.ts churn without touching their slice.
- NOTE: src/updates/updates.test.ts has 1 red ("disabled/unsupported platform") from another agent's in-flight updates refactor (static props DISABLE_ENV_FLAG/SUPPORTED_PLATFORMS) — exogenous, not from this work; left untouched.
---

## 2026-05-29 — persistence-repositories (SQLite DB layer → workspace-server, in-process keep-sync)

- Moved: `apps/code/src/main/db/**` → `packages/workspace-server/src/db/**` (drizzle `schema`, `DatabaseService`, 8 repositories + `.mock`, `test-helpers`, migrations). New `db/identifiers.ts` (`DATABASE_SERVICE`) + `db/db.module.ts`.
- Registered: `databaseModule` bound in main `di/container.ts` (`container.load`); `DatabaseService` injects platform `STORAGE_PATHS_SERVICE`; repos inject `DATABASE_SERVICE`.
- Data: source of truth is the on-disk SQLite (`posthog-code.db`); repositories are the typed sync access layer (unchanged — kept in-process, not cross-process).
- Cleaned: dropped main logger + `MAIN_TOKENS`/`@shared` coupling from db (inlined `CloudRegion`, `SuspensionReason`, package-local `normalize-path`). Fixed apps/code `vitest.config` to reuse `rendererAliases` (`@posthog/*` workspace aliases).
- Bridge: `MAIN_TOKENS.DatabaseService` → `DATABASE_SERVICE`, and the 8 `MAIN_TOKENS.*Repository` bindings (now → package classes) remain (PORT NOTE in container.ts) so the 19 consumers are unchanged; only their db type-import paths were repointed. Build: `copy-drizzle-migrations` source + `drizzle.config` repointed to the package; runtime read path unchanged.
- Validation: `pnpm typecheck` 19/19; `pnpm --filter code test` 124 files / 1527 pass (incl. real-SQLite archive integration); `pnpm dev:code` boots clean (migrations copied, in-process DB init, live tRPC IPC, no errors). Unblocks the persistence-coupled core tier (folders/workspace/archive/suspension/handoff/agent/auth).

## 2026-05-29 — power-manager-capability (retire platform-identifiers power-manager bridge)

- Moved: auth, sleep, agent services now inject `POWER_MANAGER_SERVICE` (@posthog/platform/power-manager) instead of `MAIN_TOKENS.PowerManager`.
- Cleaned: removed the `MAIN_TOKENS.PowerManager` alias (container.ts) + token (tokens.ts) + sleep's unused MAIN_TOKENS import. ElectronPowerManager adapter unchanged (dumb onResume/preventSleep). Sleep-blocking decisions remain in SleepService.
- Validation: my files typecheck clean (unrelated git.ts errors are concurrent git-read WIP); biome clean. GUI smoke pending.

## 2026-05-29 — deep-links (partial: host-agnostic parsers → @posthog/shared)

- Moved: `decodePlanBase64` + `parseGitHubIssueUrl` (were private in `apps/code/src/main/services/new-task-link/service.ts`) → `packages/shared/src/deep-links.ts` (+ `GitHubIssueRef` type), exported from the shared barrel. new-task-link now imports them from `@posthog/shared`.
- Data: pure host-agnostic parsing utilities; no state. (Slice said `core`, but zero-dep pure utils belong in `shared`.)
- Bridge: none. Host wiring (Electron protocol registration via IAppLifecycle, IMainWindow focus, event emit/queue) intentionally stays in the apps/code link services.
- Remaining (slice in_progress): move `getDeeplinkProtocol` + `NewTaskLinkPayload`/`NewTaskSharedParams` to @posthog/shared (repoint ~10 importers); extract deep-link URL-decomposition + task/inbox path parsers.
- Validation: shared build + typecheck; `deep-links.test.ts` 8/8; apps/code typecheck clean for deep-links files.

## 2026-05-29 — dialog-capability (retire platform-identifiers dialog bridge)

- Moved: 4 main consumers (os.ts router, handoff, context-menu, folders) now inject `DIALOG_SERVICE` (@posthog/platform/dialog) instead of `MAIN_TOKENS.Dialog`.
- Cleaned: removed the `MAIN_TOKENS.Dialog` `.toService` alias (container.ts) + token (tokens.ts). ElectronDialog adapter unchanged (thin wrapper).
- Remaining: os.ts (396-line serviceless router) -> backing-service split (acceptance #2) overlaps os/misc-host-capabilities; deferred. GUI smoke (file picker + message box) pending.
- Validation: dialog edits typecheck clean (unrelated git.ts WorkspaceClient error is the concurrent git-read agent's WIP); biome clean.

## 2026-05-29 — clipboard-capability (retire platform-identifiers clipboard bridge)

- Moved: sole main consumer `external-apps/service.ts` now injects `CLIPBOARD_SERVICE` (@posthog/platform/clipboard) instead of `MAIN_TOKENS.Clipboard`.
- Cleaned: removed the `MAIN_TOKENS.Clipboard` `.toService(CLIPBOARD_SERVICE)` alias (container.ts) and the `MAIN_TOKENS.Clipboard` token (tokens.ts). ElectronClipboard adapter unchanged (already a dumb writeText wrapper).
- Note: renderer copy uses `navigator.clipboard` directly (host-appropriate DOM API), not trpcClient — no clipboard misuse to migrate. Image copy/paste path is os.ts saveClipboardImage (separate slice).
- Validation: apps/code(node) typecheck; platform-identifiers test 4/4. GUI smoke (copy text/image) pending.

## 2026-05-29 — notifications (renderer-consumed capability; gating in packages/ui, host adapter dumb)

- Moved: gating from `apps/code/src/renderer/utils/notifications.ts` -> `packages/ui/src/features/notifications/TaskNotificationService` (stopReason + focus/active-task + settings gating, title truncation). New platform contract `packages/platform/src/notifications.ts` (`INotifications`: notify/showUnreadIndicator/requestAttention, `NOTIFICATIONS_SERVICE`). New renderer adapter `apps/code/src/renderer/platform-adapters/notifications.ts` (dumb trpcClient.notification wrapper).
- Registered: `notificationsUiModule` (binds TaskNotificationService) loaded in `desktop-contributions.ts`; `NOTIFICATIONS_SERVICE` + the settings/active-view/sound UI ports bound in `desktop-services.ts`.
- Data: source of truth for "should notify" is the gating in TaskNotificationService, computed from injected facts (settings snapshot, document focus, active task id). No persisted/duplicated state.
- Bridge: `apps/code/src/renderer/utils/notifications.ts` free functions now delegate to TaskNotificationService via the renderer container (PORT NOTE). Retire when the sessions service uses `useService` directly. Main NotificationService/router/electron-notifier unchanged.
- Cleaned: platform interface is host-neutral (showUnreadIndicator/requestAttention, not dockBadge/bounceDock — adapter maps to the existing trpc procedure names).
- Validation: platform typecheck+build; apps/code web typecheck 0 errors; 12 TaskNotificationService unit tests pass. GUI smoke not yet run.

## 2026-05-29 — ui-primitives (dependency-clean leaf primitives → packages/ui/src/primitives) — in_progress (partial)

- Moved: `components/ui/{Tooltip,Button,Badge,KeyHint,PanelMessage,StepList,SafeImagePreview}`, `components/{List,Divider,DotsCircleSpinner,DotPatternBackground,CodeBlock}`, `components/ui/combobox/{Combobox,Combobox.css,useComboboxFilter}`, `hooks/{useDebounce,useDebouncedValue,useInView,useImagePanAndZoom}`, `utils/{toast,confetti}` → `packages/ui/src/primitives/**`.
- Registered: none (pure presentational primitives; no DI module). Importers across `apps/code/src` rewritten to `@posthog/ui/primitives/*` (short + `@renderer/*` + relative forms all covered).
- Data: no state; these are stateless visual/util primitives.
- Cleaned: packages/ui gained deps `@posthog/shared`, `@radix-ui/react-tooltip`, `@radix-ui/react-icons`, `cmdk`, `canvas-confetti`, `sonner` (+`@types/canvas-confetti`).
- Bridge: colocated tests/stories (CodeBlock/useDebounce/useImagePanAndZoom tests, combobox test+story) stay in apps/code pointing at `@posthog/ui` paths until packages/ui gets vitest/storybook infra.
- Deferred/not-primitives: FileIcon (host asset glob), RelativeTimestamp/action-selector/useBlurOnEscape/syntax-highlight/HighlightedCode (blocked on renderer-shared-utils + code-editor slices); HeaderRow/HedgehogMode/ZenHedgehog/focusToast/useAutoFocusOnTyping/TreeDirectoryRow are feature-coupled (belong to feature slices, not primitives).
- Validation: `pnpm typecheck` 19/19 green.

## 2026-05-29 — fs-capability (workspace-server owns fs syscalls; main is a WorkspaceClient bridge) — needs_validation

- Moved: all 8 fs methods (listRepoFiles+30s cache, readRepoFile(s), readRepoFile(s)Bounded, readAbsoluteFile, readFileAsBase64, writeRepoFile) `apps/code/src/main/services/fs/service.ts` -> `packages/workspace-server/src/services/fs/service.ts` (joins existing listDirectory). fs schemas -> `packages/workspace-server/src/services/fs/schemas.ts` (source of truth); deleted the main copies.
- Registered: 8 one-line `fs.*` procedures in `packages/workspace-server/src/trpc.ts`. Main `MAIN_TOKENS.FsService` now bound in `index.ts` via `toConstantValue(new FsService(workspaceClient))` (bridge), removed from `di/container.ts`.
- Data: source of truth is workspace-server FsService; the list cache (TTL + write-self-invalidation) lives there; renderer react-query cache is the user-facing projection (invalidated by useFileWatcher).
- Cleaned: fs no longer injects FileWatcherBridge — the watcher coupling only fed the server cache, now reconciled via TTL + renderer-side invalidation. Removes one of the 4 FileWatcherBridge-retirement consumers (remaining: archive, suspension, workspace).
- Bridge: `apps/code/src/main/services/fs/service.ts` (PORT NOTE) until AgentService reads/writes via workspace-client directly.
- Validation: ws-server typecheck + fs service.test.ts 6/6 (incl. tmp-dir round-trip + path-traversal guard); apps/code typecheck clean for all fs files. Boot smoke deferred (shared tree red from concurrent ui-primitives move).

## 2026-05-29 — connectivity (workspace-server owns polling/detection; main is status-caching bridge)

- Moved: `apps/code/src/main/services/connectivity/service.ts` polling/HTTP-reachability/backoff -> `packages/workspace-server/src/services/connectivity/{service,schemas,service.test}.ts`. New `connectivity.{getStatus,checkNow,onStatusChange}` procedures in ws `trpc.ts` (one-line forwards), bound in ws `di/{tokens,container}.ts`.
- Data: source of truth is the live network-reachability poll in the single ws-server ConnectivityService; `isOnline` is its derived state. The main bridge caches the latest value so AuthService can read it synchronously.
- Bridge: `apps/code/src/main/services/connectivity/service.ts` is now a `WorkspaceClient` bridge (extends TypedEventEmitter; subscribes to ws `onStatusChange`, re-emits `StatusChange`, answers `getStatus()` from cache). Bound in `index.ts` after `wsServer.start()`, before `initializeServices()` (AuthService consumer). Main connectivity router + renderer connectivityStore/toast unchanged.
- Bridge retirement: delete when AuthService + renderer consume `workspaceClient.connectivity` directly.
- Cleaned: dropped main-process logger from the capability; polling timer is `unref`'d; emit-on-change-only preserved.
- Validation: ws-server + apps/code(node) typecheck; 11 unit tests pass. GUI smoke not yet run.

## 2026-05-29 — local-logs (workspace-server owns fs read/coalesced write)

- Moved: `apps/code/src/main/services/local-logs/service.ts` logic → `packages/workspace-server/src/services/local-logs/{service,schemas,service.test}.ts`. New `localLogs.{read,write}` procedures in `packages/workspace-server/src/trpc.ts` (one-line forwards), bound in ws `di/{tokens,container}.ts`.
- Data: source of truth is the on-disk NDJSON at `~/.posthog-code/sessions/<taskRunId>/logs.ndjson`; the single-flight latest-wins write coalescing (per `taskRunId`) now lives in the one workspace-server instance, so all writers (renderer via `logs` router, future main callers) funnel through it.
- Bridge: `apps/code/src/main/services/local-logs/service.ts` is now a thin `LocalLogsService` over `WorkspaceClient.localLogs`, bound in `index.ts` after `wsServer.start()` (mirrors FocusService/FileWatcherBridge). `logs.ts` router and the renderer sessions service are unchanged (still `trpcClient.logs.{readLocalLogs,writeLocalLogs}`).
- Bridge retirement: delete the main bridge + `logs` router local-log procedures when the renderer sessions service consumes `workspaceClient.localLogs` directly.
- Cleaned: dropped the main-process logger dependency from the capability (ws services don't log; failures still degrade to null/no-op as before).
- Known debt: `DATA_DIR` (".posthog-code") is duplicated in the ws service, apps/code `shared/constants.ts`, and handoff `seedLocalLogs` (raw fs). Consolidate into `@posthog/shared` once the di-foundation lockfile churn settles. handoff still writes the same NDJSON via raw fs (pre-existing) — should adopt the capability later.
- Validation: ws-server + ws-client + apps/code(node) typecheck; 11 unit tests pass (vitest, ws-server root). GUI smoke (logs stream/render) not yet run.

## 2026-05-29 — di-foundation (shared DI primitives)

- Moved: `packages/ui/src/workbench/{contribution.ts,service-context.tsx}` → `packages/di/src/{contribution.ts,react.tsx}` (`git mv`). `startWorkbenchContributions` → `startWorkbench`.
- New package `@posthog/di`: owns `WORKBENCH_CONTRIBUTION` + `WorkbenchContribution` + `startWorkbench(container)`, `useService`/`ServiceProvider` (React boundary hook — see REFACTOR.md "React Access to Services": component-boundary only, never a service-locator), and a host-agnostic `WorkbenchLogger`/`WORKBENCH_LOGGER` port.
- Registered: `fileWatcherUiModule` (`ContainerModule`) binds `FileWatcherContribution` as a `WORKBENCH_CONTRIBUTION`. `apps/code` `desktop-contributions.ts` `container.load`s it; `desktop-services.ts` binds `WORKBENCH_LOGGER` to the renderer electron-log scope; `main.tsx` calls `startWorkbench(container)` before render.
- Data: source of truth is `packages/di` for the workbench DI primitives; no persisted/derived state.
- Cleaned: renderer Vite resolves `@posthog/di/*` via a new alias in `vite.shared.mts` (consistent with every other workspace package, which the repo aliases to `src/$1` rather than node_modules `exports`). `packages/ui/tsconfig.json` gained `experimentalDecorators`+`emitDecoratorMetadata` (first `@injectable` in ui; mirrors workspace-server).
- Bridge: none.
- Validation: `pnpm typecheck` (19 tasks); `@posthog/di` `startWorkbench` unit test; `pnpm --filter code test` (1588) after `build:deps`; `pnpm dev:code` boots to a rendered window with live tRPC IPC and zero resolution/boot errors.

## 2026-05-29 — platform-identifiers (package-owned DI symbols + MAIN_TOKENS bridge) — needs_validation

- Added: `export const <CAP>_SERVICE = Symbol.for("posthog.platform.<cap>")` to all 15 `packages/platform/src/*.ts` interface files. Each platform capability now owns its Inversify identifier beside its interface (no new identifiers added to `apps/code/src/main/di/tokens.ts`).
- Registered: `apps/code/src/main/di/container.ts` binds each Electron adapter to its package-owned identifier (`bind(CLIPBOARD_SERVICE).to(ElectronClipboard)`, …) and aliases the legacy `MAIN_TOKENS.<Platform>` entries via `bind(MAIN_TOKENS.Clipboard).toService(CLIPBOARD_SERVICE)`. Same singleton, single source of truth.
- Data: source of truth is the platform identifier binding; `MAIN_TOKENS.*` platform entries are projections (aliases). Interfaces audited host-neutral (no electron/macos/dock/taskbar/tray/safeStorage terms); platform imports nothing internal.
- Bridge: the 15 `MAIN_TOKENS.<Platform>` `toService` aliases remain (PORT NOTE in container.ts). Retire each once its consumers inject the `@posthog/platform` identifier directly — done per feature slice (clipboard/dialog/secure-storage/notifications/updater/power-manager/context-menu capability slices).
- Validation: `@posthog/platform` build + typecheck green; `apps/code` typecheck (node+web) green; `apps/code/src/main/di/platform-identifiers.test.ts` 4/4 (identifiers unique/namespaced; toService alias === platform singleton). Boot smoke deferred — boot path concurrently owned by in-progress di-foundation in this shared worktree.

## 2026-05-28 — file-watcher (workspace-server owns orchestration, hook is pure useSubscription)

- Moved: `apps/code/src/main/services/file-watcher/` deleted entirely. Orchestration (debounce, bulk threshold, git event filtering, git-dir resolution) lives in `packages/workspace-server/src/services/watcher/service.ts` as `WatcherService.watchRepo()`. New tRPC subscription procedure `fileWatcher.watch` emits the processed `FileWatcherEvent` discriminated union. Raw `watcher.watch` still available for unprocessed events.
- **Nothing for file-watcher lives in `packages/core/`.** The "orchestration" we thought belonged in core (debounce, bulk threshold, git filtering) turned out to be *source-smoothing* — properties of the event source, not domain logic. Source-smoothing belongs with the source. Core is for business state machines, retries, cross-feature coordination — none of which file-watcher has.
- New transport (still applies): `workspace-client` uses `splitLink` over `httpSubscriptionLink` (SSE) for subscriptions + `httpBatchLink` for queries/mutations. SSE auth via `?secret=` query param since EventSource can't send headers.
- Renderer hook (`packages/ui/src/features/file-watcher/useFileWatcher.ts`) is a 5-line `useSubscription(trpc.fileWatcher.watch.subscriptionOptions(...))` wrapper. No `useEffect`, no `for-await`, no orchestration state — pure react-query idiom. Caller passes a single `onEvent` callback and switches on `event.kind`.
- Main bridge: `apps/code/src/main/services/file-watcher/bridge.ts` is a small `FileWatcherBridge` class (~40 lines) that subscribes to `fileWatcher.watch` via workspace-client and re-emits via `TypedEventEmitter` for the four legacy in-process consumers (`fs`, `archive`, `suspension`, `workspace`). Bound at `MAIN_TOKENS.FileWatcherService` via `container.bind(...).toConstantValue(new FileWatcherBridge(workspaceClient))` in `index.ts` after `workspaceServer.start()`.
- Bridge retirement: delete `FileWatcherBridge`, its router, and the renderer's `start`/`stop` mutation calls when **fs**, **archive**, **suspension**, **workspace** migrate. Those consumers will then use `useFileWatcher` directly (renderer) or subscribe via workspace-client (background work in workspace-server or main).
- Cleaned: `WatcherRegistryService` dep dropped (its `isShutdown` check is unnecessary — subscriptions die naturally when workspace-server child or main process exits). Schemas split out of `trpc.ts` into per-service `schemas.ts`. Router is now strict one-liners.
- Left as-is: two parallel watcher pipelines per repo (the bridge + the renderer each subscribe to workspace-server); workspace-server doesn't dedupe parcel watchers. `FsService` in main still owns its file-cache invalidation. `WatcherRegistryService` still used by focus + app-lifecycle.
- New import paths: `import { useFileWatcher } from "@posthog/ui/features/file-watcher/useFileWatcher"`. For main consumers needing kind constants: `import { FileWatcherEventKind } from "@posthog/workspace-server/services/watcher/schemas"`. Bridge class: `apps/code/src/main/services/file-watcher/bridge.ts`.

---

## 2026-05-28 — api-client (transport only)

- Moved: `apps/code/src/renderer/api/{fetcher,generated,generated.augment,fetcher.test}.ts` → `packages/api-client/src/`. `generated.augment.d.ts` → `.ts` (side-effect import from `index.ts` so apps/code's tsc picks up the module augmentation through the package's exports).
- Cleaned: `__APP_VERSION__` Vite global removed from fetcher — now an `appVersion` field on `ApiFetcherConfig`. Renderer wrapper passes the global at construction.
- Left as-is: the 2929-line `posthogClient.ts` god-class. Tagged with a `PORT NOTE` — gets sliced into `packages/core/<feature>/service.ts` per feature, following REFACTOR.md "Coexistence and bridges".
- New import path: `@posthog/api-client` (was `@renderer/api/{fetcher,generated}`). Also updated `scripts/update-openapi-client.ts` to write into the new package.

---

## 2026-05-28 — focus (core owns orchestration, workspace-server owns host/git work)

- Moved host operations out of Electron main: `apps/code/src/main/services/focus/sync-service.ts` deleted; git/worktree/watch logic now lives in `packages/workspace-server/src/services/focus/{service,sync-service}.ts` behind one-line `focus.*` procedures in `packages/workspace-server/src/trpc.ts`.
- Moved orchestration out of the renderer: `apps/code/src/renderer/stores/sagas/focusSagas.ts` deleted; multi-step enable/disable/restore flow now lives in `packages/core/src/focus/service.ts` as `FocusController`, with dependencies injected as a pure interface.
- Renderer stays thin: `apps/code/src/renderer/stores/focusStore.ts` is now UI state plus one controller call per action. It adapts existing tRPC calls into the core dependency interface and no longer owns the flow graph.
- Main is a bridge, not the source of truth for focus logic: `apps/code/src/main/services/focus/service.ts` now persists the local session snapshot for Electron restarts, forwards mutations/queries to workspace-server through `WorkspaceClient`, and re-emits focus events to legacy main-router subscribers.
- Bridge retirement: delete the main `FocusService` shim and move persisted focus-session storage out of Electron once session restore/event subscribers can read directly from workspace-server (or the eventual shared persistence layer). At that point the main `focus` router can disappear with the bridge.
- Left as-is: restore still re-saves the validated session before starting workspace-server watchers so the server-side in-memory session map is repopulated after app restart. That is intentional coexistence glue, not the final architecture.

---

## 2026-05-27 — diff-stats

- Moved: `apps/code/src/main/services/git/getDiffStats` → `packages/workspace-server/src/services/git/service.ts` + `packages/ui/src/features/diff-stats/`
- New: `@posthog/workspace-server`, `@posthog/workspace-client`, `@posthog/ui` packages. Workspace-server runs as a child process spawned by Electron (`ELECTRON_RUN_AS_NODE=1`).
- Cleaned: PSK comparison now uses `timingSafeEqual`. `DiffStats` schema is the source of truth (`z.infer`), not the type. Connection query invalidates on child exit via a tRPC subscription.
- Left as-is: `useTaskDiffSummaryStats` still has 4 modes (local/branch/PR/cloud). Collapses once the relay protocol exists.
- New import paths: `useDiffStats(repoPath)` from `@posthog/ui/features/diff-stats/useDiffStats` (was `trpc.git.getDiffStats`). `DiffStatsBadge` from `@posthog/ui/features/diff-stats/DiffStatsBadge`.

## 2026-05-29 — environments (TOML CRUD -> workspace-server, UI -> packages/ui)

- Moved: `apps/code/src/main/services/environment/{service,schemas,service.test}.ts` -> `packages/workspace-server/src/services/environment/`. fs-based TOML environment CRUD is a host capability.
- Registered: ws-server `TOKENS.EnvironmentService` + `environment` tRPC router (list/get/create/update/delete, zod in/out). Added vitest to workspace-server (test script + config + smol-toml dep).
- Moved: `apps/code/src/renderer/features/environments/components/EnvironmentSelector.tsx` -> `packages/ui/src/features/environments/` + new `useEnvironments` hook (workspace-client). Cross-feature settings reach-in replaced by an `onCreateEnvironment` prop wired in TaskInput.
- Data: source of truth is the per-repo `.posthog-code/environments/*.toml` files, read/written by ws-server EnvironmentService; `Environment` zod schema is the contract. Renderer holds no env truth (react-query cache).
- Bridge: `apps/code/src/main/services/environment/service.ts` now forwards to workspace-client (binding in `index.ts`); main `environment` router + `environment/schemas.ts` remain until the settings/task-detail renderer consumers move to workspace-client.
- Deferred: `session-env/loader.ts` (agent bash env + CLAUDE_CONFIG_DIR) stays in main.
- Validation: ws-server typecheck + 21 environment tests; packages/ui typecheck; apps/code 0 new typecheck errors. App smoke pending.

## 2026-05-29 — git-read (read-only git ops -> workspace-server)

- Split: `git-core` -> `git-read` / `git-worktree` / `git-mutate` / `git-pr` sub-slices (git-core marked blocked/superseded).
- Moved: read-only git ops into `packages/workspace-server/src/services/git/` (thin wrappers over `@posthog/git/queries`) behind a one-line `git` tRPC router (zod in/out).
- Registered: `MAIN_TOKENS.WorkspaceClient` (the workspace-client bound in `index.ts` after `workspaceServer.start()`).
- Bridge: `apps/code/src/main/trpc/routers/git.ts` read procedures forward to ws-server via workspace-client. Main `GitService` retains read methods for in-process callers (WorkspaceService/HandoffService); retire with git-mutate/git-worktree + ui-git-interaction.
- Data: read git state computed by `@posthog/git/queries` in ws-server; no new persisted state. Reads are lockless; the per-repo write lock stays with git-mutate.
- Validation: ws-server typecheck; apps/code 0 new errors on git surface; env tests 21/21. App smoke pending.

## 2026-05-29 — provisioning (UI -> packages/ui, subscription -> contribution)

- Moved: `apps/code/src/renderer/features/provisioning/{stores/provisioningStore,components/ProvisioningView}` -> `packages/ui/src/features/provisioning/{store,ProvisioningView}`. Output processing (stripAnsi/processOutput) moved from the view into the store.
- Registered: `provisioningUiModule` (WORKBENCH_CONTRIBUTION -> ProvisioningContribution); `PROVISIONING_OUTPUT_PORT` host port; desktop `TrpcProvisioningOutputService` adapter bound in desktop-services; module loaded in desktop-contributions.
- Cleaned: removed component-level `useSubscription` (forbidden) — contribution subscribes once and writes the store; view is pure. Added zustand to @posthog/ui (first store in the package).
- Data: source of truth is the main ProvisioningService relay (fed by WorkspaceService.emitOutput); the ui store is a subscription-fed cache (activeTasks Set + output lines per taskId).
- Bridge: main ProvisioningService + provisioning router remain (WorkspaceService is the producer) until the workspace slice migrates.
- Validation: packages/ui typecheck; apps/code typecheck fully green; saga test 7/7. App smoke pending.

## 2026-05-29 - core-domain-types (host-neutral type ownership)
- Moved: `WorkspaceMode` -> `@posthog/shared` (`packages/shared/src/workspace.ts`); `HandoffLocalGitState` + `GitHandoffCheckpoint` (origin `@posthog/git/handoff`) -> `@posthog/shared` (`packages/shared/src/git-handoff.ts`).
- Registered: `@posthog/shared` index barrel exports `WorkspaceMode`, `HandoffLocalGitState`, `GitHandoffCheckpoint`.
- Data: source of truth for these host-neutral domain types is now `@posthog/shared`; `@posthog/git`, `@posthog/agent`, `@posthog/workspace-server`, and apps/code consume/re-export from it. `packages/core` may now import them without violating import rules (core may not import `@posthog/agent` or `@posthog/workspace-server`).
- Cleaned: removed apps/code handoff schema reach-in to ws-server db repository for `WorkspaceMode`; removed `@posthog/agent` -> `@posthog/git/handoff` dependency for the two handoff data types.
- Bridge: `@posthog/git/handoff` and `@posthog/workspace-server/.../workspace-repository` re-export the relocated types for existing consumers; retire when all consumers import from `@posthog/shared`.
- Bridge: PostHogAPIClient contract + Task/resume domain types NOT yet relocated -> tracked as slice `agent-domain-types`.
- Validation: typecheck clean across shared/git/agent/workspace-server/core/apps/code (node+web); git handoff 158/158.

## 2026-05-29 — persistence-layer (reconcile + real-SQLite round-trip test)

- Decision (recorded): domain SQLite persistence lives in `packages/workspace-server` (Node-only host capability; travels with the future cloud sandbox). The move itself landed under the `persistence-repositories` slice.
- Added: `packages/workspace-server/src/db/repositories/repositories.test.ts` — the only real-SQLite repository round-trip test (RepositoryRepository CRUD + repository→workspace→worktree FK chain), using the sanctioned `createTestDb()` + stub-DatabaseService pattern. The archive integration test mocks repositories, so this fills the genuine round-trip gap.
- Data: drizzle table schema is the single source of truth for DB row shapes (`$inferSelect`/`$inferInsert`). Repositories are in-process, not a serialization boundary — no parallel zod on repo contracts (would duplicate truth). Zod lives at the tRPC boundary in consumer feature slices.
- Bridge: `MAIN_TOKENS.*Repository` + `MAIN_TOKENS.DatabaseService` aliases remain in apps/code container.ts (PORT NOTE) until consumers inject `DATABASE_SERVICE`/package repositories directly.
- Validation: ws-server typecheck clean with the test added; no Electron imports (grep). Round-trip test EXECUTION gated on node-ABI better-sqlite3 — local snapshot has Electron-ABI (NODE_MODULE_VERSION 145) so plain-node vitest can't load it; runs green in CI / after `pnpm install`. Rebuilding locally was declined (would break the shared Electron app other agents smoke-test).

## 2026-05-29 - auth (utils sub-slice)

- Moved: `apps/code/src/renderer/features/auth/utils/userInitials.ts` -> `packages/ui/src/features/auth/userInitials.ts` (pure projection, with test)
- Registered: added vitest runner to `@posthog/ui` (vitest.config.ts + test script); first tests in the package
- Data: source of truth is the user record; `getUserInitials` is a pure derived projection (UserLike -> initials)
- Consumers: `SettingsDialog`, `AccountSettings` import from `@posthog/ui/features/auth/userInitials`
- Bridge: none (clean move; old path deleted)
- Validation: `pnpm --filter @posthog/ui test` (28 passed), `@posthog/ui typecheck` clean
- Note: `auth` slice split into auth-utils/auth-core/auth-callback-server/auth-ui; only auth-utils landed

## 2026-05-29 - agent-domain-types (Task DTO relocation, partial)
- Moved: PostHog Task DTOs (`Task`, `TaskRun`, `TaskRunArtifact`, `ArtifactType`, `TaskRunStatus`, `TaskRunEnvironment`, `PostHogAPIConfig`) `@posthog/agent/types` -> `@posthog/shared` (`packages/shared/src/task.ts`).
- Registered: `@posthog/shared` index barrel exports the Task DTOs; `@posthog/agent/types` re-exports them so all existing consumers keep working.
- Data: source of truth for the host-neutral PostHog Task model is now `@posthog/shared`; `packages/core` may import it without importing `@posthog/agent` (forbidden by import rules).
- Bridge: `@posthog/agent/types` re-export remains for existing consumers; retire when they import from `@posthog/shared`.
- Bridge: PostHogAPIClient method contract (interface in `@posthog/api-client`) + resume DATA types (`ResumeState`,`ConversationTurn`) NOT yet relocated — remain in `agent-domain-types` (needs new dep edges).
- Validation: typecheck clean across shared/agent/workspace-server/ui/core; apps/code residual errors are an unrelated concurrent process-tracking move.

## 2026-05-29 - auth (ui-state-store) + regions

- Moved: `apps/code/src/renderer/features/auth/stores/authUiStateStore.ts` -> `packages/ui/src/features/auth/authUiStateStore.ts` (thin UI store)
- Moved: `apps/code/src/shared/types/regions.ts` -> `packages/shared/src/regions.ts` (host-agnostic region types)
- Registered: `CloudRegion`/`RegionLabel`/`REGION_LABELS`/`formatRegionBadge` on the `@posthog/shared` barrel
- Data: auth form UI state (mode/invite/region) owned by the thin store; region constants are pure data in shared
- Bridge: `apps/code/src/shared/types/regions.ts` re-exports `@posthog/shared` until all 13 importers move
- Validation: ui + apps/code typecheck both 0 errors; ui tests 28 passed

## 2026-05-29 - process-tracking

- Moved: `apps/code/src/main/services/process-tracking/service.ts` -> `packages/workspace-server/src/services/process-tracking/process-tracking.ts`; `apps/code/src/main/utils/process-utils.ts` -> `packages/workspace-server/src/services/process-tracking/process-utils.ts`
- Registered: `processTrackingModule` (binds `PROCESS_TRACKING_SERVICE`); zod boundary schemas in package `schemas.ts`
- Data: source of truth is the in-memory live-PID registry owned by ProcessTrackingService (model `TrackedProcess`); `ProcessSnapshot`/`DiscoveredProcess` are derived projections
- Cleaned: dropped app-logger coupling (ws-server no-logger convention); router uses package zod schemas, inline z.enum removed
- Decision: IN-PROCESS KEEP — bound in main (not the ws-server child) so the 6 synchronous consumers (shell/agent/workspace/archive/suspension/app-lifecycle) are unchanged. Same pattern as the SQLite DB layer.
- Bridge: `MAIN_TOKENS.ProcessTrackingService` toService(`PROCESS_TRACKING_SERVICE`) in apps/code container; `apps/code/src/main/utils/process-utils.ts` re-export shim. Retire when consumers inject the package identifier; re-bind to the ws-server child when shell+agent move there.
- Validation: ws-server typecheck + 37 unit tests; `pnpm typecheck` 19/19; `pnpm --filter code test` 122 files/1474; `pnpm dev:code` clean boot

## 2026-05-29 - workspace-settings-capability
- Moved: worktree/auto-suspend settings reads off direct `settingsStore` import -> `@posthog/platform/workspace-settings` (`IWorkspaceSettings` / `WORKSPACE_SETTINGS_SERVICE`).
- Registered: `ElectronWorkspaceSettings` adapter bound to `WORKSPACE_SETTINGS_SERVICE` in `apps/code/src/main/di/container.ts`.
- Data: source of truth stays the apps/code electron-store `settingsStore`; the adapter wraps it; legacy worktree-dir default migration stays in the adapter (apps/code).
- Cleaned: `FoldersService` injects the port instead of importing `settingsStore` free functions (first consumer).
- Bridge: `settingsStore` free functions remain for the other consumers (archive, suspension, workspace, focus shim, shell, os router, worktree-helpers) until their slices migrate to the port.
- Validation: platform + apps/code (node+web) typecheck 0 errors; folders service.test.ts 23/23.

## 2026-05-29 - shared domain primitives

- Moved: `apps/code/src/shared/utils/{urls,backoff,repo}.ts` -> `packages/shared/src/*`
- Registered: `getCloudUrlFromRegion`, `getBackoffDelay`/`sleepWithBackoff`/`BackoffOptions`, `normalizeRepoKey` on the `@posthog/shared` barrel
- Data: pure host-agnostic primitives; `@posthog/shared` is now the single source
- Bridge: `apps/code/src/shared/utils/{urls,backoff,repo}.ts` re-export `@posthog/shared` until importers move
- Validation: @posthog/shared + @posthog/code typecheck both 0 errors

## 2026-05-29 — repository DI identifiers (persistence-layer cont.)

- Added: package-owned repository identifiers in `packages/workspace-server/src/db/identifiers.ts` (REPOSITORY/WORKSPACE/WORKTREE/ARCHIVE/SUSPENSION/AUTH_SESSION/AUTH_PREFERENCE/DEFAULT_ADDITIONAL_DIRECTORY) + `db/repositories.module.ts` binding each class.
- Changed: `apps/code/src/main/di/container.ts` loads `repositoriesModule`; `MAIN_TOKENS.*Repository` are now `.toService()` bridges over the package symbols (was `.to(Class)`).
- Why: the repo classes had moved to the package but their DI identifiers were still apps/code-local, so no package service could inject a repository. This unblocks folders/archive/suspension/workspace.
- Validation: full `pnpm typecheck` 19/19 green at the time of this change.

## 2026-05-29 — folders (FoldersService -> workspace-server)

- Moved: `apps/code/src/main/services/folders/{service,service.test,schemas}.ts` -> `packages/workspace-server/src/services/folders/{folders,folders.test,schemas}.ts` + new `folders.module.ts`, `identifiers.ts`, `ports.ts`.
- Registered: `foldersModule` (binds FOLDERS_SERVICE); hosted in apps/code's container (shares the single SQLite connection — not ws-server tRPC).
- Data: source of truth is the SQLite repositories (injected via package identifiers); worktree base path via `WORKSPACE_SETTINGS_SERVICE.getWorktreeLocation()` (reused the platform capability, no duplicate port). `normalizeRepoKey` inlined.
- Cleaned: router/skills repointed to package imports; `apps/code/.../folders/schemas.ts` reduced to a type-only re-export for renderer type consumers (no ws-server runtime pulled into the renderer bundle).
- Bridge: `MAIN_TOKENS.FoldersService -> FOLDERS_SERVICE`; `FOLDERS_LOGGER` bound to `logger.scope("folders-service")`. Retire MAIN_TOKENS.FoldersService once consumers inject FOLDERS_SERVICE.
- Validation: ws-server typecheck clean; `folders.test.ts` 23/23 in the new home; apps/code typecheck has zero folders-related errors (remaining apps/code/core red is exogenous: concurrent handoff/agent-types + context-menu migrations). App smoke pending (tree can't fully build while those are red).

## 2026-05-29 - misc-host-capabilities (platform alias retirements)
- Cleaned: retired 4 `MAIN_TOKENS.*` platform-alias bridges (FileIcon, AppMeta, BundledResources, ImageProcessor); 5 consumers (external-apps, agent, updates, posthog-plugin, os.ts) now inject the package-owned `@posthog/platform` symbols directly.
- Registered: removed the `.toService` aliases from `di/container.ts` and the token defs from `di/tokens.ts`.
- Bridge: `UrlLauncher`/`StoragePaths`/`MainWindow` aliases remain until their consumers migrate; os.ts still a service-less router pending carve.
- Validation: apps/code node typecheck clean in scope; behavior-preserving.

## 2026-05-29 - context-menu

- Moved: `apps/code/src/main/services/context-menu/{service,schemas,types}.ts` -> `packages/core/src/context-menu/{context-menu,schemas,types}.ts`
- Registered: `contextMenuCoreModule` (binds `CONTEXT_MENU_CONTROLLER`); new core port `CONTEXT_MENU_EXTERNAL_APPS_PORT`
- Foundation: bootstrapped core DI — added @posthog/platform + inversify + reflect-metadata to packages/core; added decorator tsconfig flags; updated core charter/description to match REFACTOR.md (host-agnostic business layer with Inversify DI over platform interfaces)
- Data: source of truth is menu content decided by the core ContextMenuService consuming platform CONTEXT_MENU_SERVICE/DIALOG_SERVICE interfaces; ElectronContextMenu adapter only renders the native menu
- Cleaned: retired MAIN_TOKENS.ContextMenu platform alias + Platform.ContextMenu token (core service injects CONTEXT_MENU_SERVICE directly); inverted external-apps coupling behind a core port
- Bridge: `CONTEXT_MENU_EXTERNAL_APPS_PORT` toService(`MAIN_TOKENS.ExternalAppsService`) until external-apps migrates to a package service
- Validation: core typecheck; `pnpm typecheck` 19/19; `pnpm --filter code test` 120/1450; `pnpm dev:code` clean boot

## 2026-05-29 — archive (ArchiveService -> workspace-server)

- Moved: `apps/code/src/main/services/archive/{service,service.integration.test,schemas}.ts` -> `packages/workspace-server/src/services/archive/{archive,archive.integration.test,schemas}.ts` + `archive.module.ts`, `identifiers.ts`, `ports.ts`.
- Registered: `archiveModule` (binds ARCHIVE_SERVICE); hosted in apps/code container (single SQLite conn, not ws-server tRPC).
- Ports: ARCHIVE_SESSION_CANCELLER (AgentService.cancelSessionsByTaskId) + ARCHIVE_FILE_WATCHER (FileWatcherBridge.stopWatching), bound via container.toDynamicValue lazy ctx.get; ARCHIVE_LOGGER -> logger.scope("archive"); worktree location via WORKSPACE_SETTINGS_SERVICE; repos via package identifiers; PROCESS_TRACKING_SERVICE.
- Data: archivedTaskSchema moved into the package; `apps/code/src/shared/types/archive.ts` -> type-only re-export (renderer type consumers unchanged, no ws-server runtime in renderer bundle).
- Bridge: `MAIN_TOKENS.ArchiveService -> ARCHIVE_SERVICE`. Retire once consumers inject ARCHIVE_SERVICE.
- Validation: ws-server typecheck clean; archive.integration.test.ts 23/23 (real git); apps/code zero archive errors (remaining red is exogenous analytics migration). App smoke pending.

## 2026-05-29 - misc-host-capabilities (os.ts service carve)
- Moved: 401-line service-less `trpc/routers/os.ts` business logic -> NEW `apps/code/src/main/services/os/service.ts` (`OsService`) + `os/schemas.ts`.
- Registered: `MAIN_TOKENS.OsService` bound to `OsService` in `di/container.ts`; `osRouter` now one-line forwards.
- Data: OsService constructor-injects DIALOG/URL_LAUNCHER/APP_META/IMAGE_PROCESSOR/WORKSPACE_SETTINGS platform capabilities; owns fs/clipboard/image host ops. Stays in apps/code main (wires Electron platform adapters).
- Cleaned: removed service-less router, inline router business logic, and business-logic container.get from the router; getWorktreeLocation now reads WORKSPACE_SETTINGS_SERVICE.
- Validation: apps/code node+web typecheck 0 errors; behavior-preserving.

## 2026-05-29 — suspension (SuspensionService -> workspace-server)

- Moved: `apps/code/src/main/services/suspension/{service,service.test,schemas}.ts` -> `packages/workspace-server/src/services/suspension/{suspension,suspension.test,schemas}.ts` + `suspension.module.ts`, `identifiers.ts`, `ports.ts`.
- Registered: `suspensionModule` (binds SUSPENSION_SERVICE); hosted in apps/code container (single SQLite conn). Ports SUSPENSION_SESSION_CANCELLER + SUSPENSION_FILE_WATCHER via toDynamicValue; SUSPENSION_LOGGER -> logger.scope("suspension"); all auto-suspend/worktree settings via WORKSPACE_SETTINGS_SERVICE; repos via package identifiers; PROCESS_TRACKING_SERVICE. Local TypedEventEmitter (no external event consumers).
- Data: suspendedTaskSchema/suspensionReasonSchema/suspensionSettingsSchema moved to the package; `apps/code/src/shared/types/suspension.ts` -> type-only re-export.
- Carve-out: sleep service (OS power) intentionally not bundled — separate concern, follow-up.
- Bridge: `MAIN_TOKENS.SuspensionService -> SUSPENSION_SERVICE`; type-imports repointed in index.ts/app-lifecycle/workspace/router.
- Validation: ws-server typecheck clean; suspension.test.ts 11/11; apps/code zero suspension errors (remaining red exogenous: @utils/path,@utils/time renderer-utils migration). App smoke pending.

## 2026-05-29 - misc-host-capabilities (MainWindow alias retirement; slice complete)
- Cleaned: retired the MainWindow MAIN_TOKENS alias; 10 consumers inject MAIN_WINDOW_SERVICE directly. With this, all 7 in-scope platform aliases (FileIcon/AppMeta/BundledResources/ImageProcessor/StoragePaths/UrlLauncher/MainWindow) are retired and os.ts is carved into OsService.
- Bridge: AppLifecycle/Updater/Notifier MAIN_TOKENS aliases remain (owned by app-lifecycle/updater/notifications slices).
- Validation: apps/code node+web typecheck 0 errors; behavior-preserving.

## 2026-05-29 — usage-schema relocation (unblocks usage-monitor)

- Moved: usageBucketSchema/usageOutput + UsageBucket/UsageOutput types from `apps/code/src/main/services/llm-gateway/schemas.ts` -> `packages/core/src/usage/schemas.ts`.
- llm-gateway/schemas.ts now value+type re-exports from `@posthog/core/usage/schemas` — llm-gateway router, usage-monitor, and the 4 renderer billing consumers are unchanged.
- Why: usage-monitor is core orchestration and core may not import apps/code; this gives the shared usage domain type a package home core can consume. (If llm-gateway later moves to ws-server, the schema can move to @posthog/shared.)
- Validation: @posthog/core typecheck clean; apps/code zero usage/llm-gateway/billing errors.

## 2026-05-29 - platform-alias bridge fully retired
- Cleaned: removed the last 3 MAIN_TOKENS platform aliases (AppLifecycle/Updater/Notifier) and the PORT NOTE bridge block. The entire MAIN_TOKENS.* -> @posthog/platform alias bridge is gone; all consumers inject package-owned platform identifiers directly.
- Validation: apps/code node+web typecheck 0 errors.

## 2026-05-29 - linear-integration (flow -> core)
- Moved: `LinearIntegrationService` + integration flow schemas `apps/code/.../linear-integration` -> `packages/core/src/integrations/{linear.ts,schemas.ts}`.
- Registered: container binds `MAIN_TOKENS.LinearIntegrationService` to the core class; router forwards.
- Bridge: `apps/code/.../integration-flow-schemas.ts` re-exports the core schemas (github/slack consume via it until they migrate).
- Validation: core integrations + apps/code node+web typecheck 0 errors.

## 2026-05-29 - typed-event-emitter (foundation)

- Moved: 3 duplicate node:events-based TypedEventEmitter copies (apps/code main util + ws-server connectivity/focus) -> ONE browser-safe impl in `packages/shared/src/typed-event-emitter.ts`
- Registered: exported `TypedEventEmitter` from the @posthog/shared barrel; added @posthog/shared dep to @posthog/workspace-server
- Data: source of truth is the single shared emitter; per-service typed event maps are projections over it
- Cleaned: removed node:events coupling from the subscription backbone so packages/core (and future web/mobile hosts) can consume it; full EventEmitter API + buffered toIterable(event,{signal})
- Bridge: `apps/code/src/main/utils/typed-event-emitter.ts` re-exports from @posthog/shared so the 24 main services + ~20 tRPC subscription routers stay unchanged — retire by repointing them to @posthog/shared
- Validation: shared unit test 13/13; pnpm typecheck 19/19; apps/code tests 1395; pnpm dev:code full boot with live subscription layer, zero emitter errors

## 2026-05-29 - DEEP_LINK platform port
- Added: `@posthog/platform/deep-link` (`IDeepLinkRegistry` / `DEEP_LINK_SERVICE` / `DeepLinkHandler`). `DeepLinkService` implements it; 7 feature consumers inject the port instead of the concrete service.
- Data: deep-link handler registry is now a host-neutral port; apps/code provides the impl; host-boot protocol registration + URL dispatch stay on the concrete service.
- Validation: apps/code node+web typecheck 0 errors.

## 2026-05-29 — usage-monitor (UsageMonitorService -> core)

- Moved: `apps/code/src/main/services/usage-monitor/{service,service.test,schemas}.ts` -> `packages/core/src/usage/{usage-monitor,usage-monitor.test,monitor-schemas}.ts` + schemas.ts (usage types), ports.ts, identifiers.ts, usage-monitor.module.ts.
- Registered: `usageMonitorModule` (binds USAGE_MONITOR_SERVICE); hosted in apps/code container. Ports: USAGE_GATEWAY (LlmGatewayService.fetchUsage), USAGE_ACTIVITY_MONITOR (AgentService LlmActivity + hasActiveSessions) via toDynamicValue; USAGE_THRESHOLD_STORE + USAGE_LOGGER via toConstantValue. Local TypedEventEmitter (router subscriptions over toIterable).
- Data: usage schema (usageBucketSchema/usageOutput) lives in @posthog/core/usage/schemas; llm-gateway/schemas.ts re-exports. usage-monitor/store.ts (electron-store) retained in apps/code, wrapped by the THRESHOLD_STORE adapter.
- Bridge: `MAIN_TOKENS.UsageMonitorService -> USAGE_MONITOR_SERVICE`; router repointed to core.
- Validation: full `pnpm typecheck` 19/19 green; usage-monitor.test 12/12 in core.

## 2026-05-30 - github + slack integration services -> core
- Moved: `GitHubIntegrationService` + `SlackIntegrationService` -> `packages/core/src/integrations/{github.ts,slack.ts}` (+ `identifiers.ts` with `IntegrationLogger` and per-provider logger tokens).
- Registered: container binds `MAIN_TOKENS.{GitHub,Slack}IntegrationService` to the core classes and the `*_INTEGRATION_LOGGER` tokens to `logger.scope(...)`; routers/index repoint to core.
- Data: services inject DEEP_LINK/URL_LAUNCHER/MAIN_WINDOW platform ports + an injected logger; flow schemas + region utils + TypedEventEmitter from core/shared. All 3 integration services (linear/github/slack) now in `packages/core`.
- Bridge: apps/code `integration-flow-schemas.ts` still re-exports core schemas; shared `features/integrations` UI not yet moved to packages/ui.
- Validation: apps/code node+web typecheck 0 errors.

## 2026-05-29 - updater (core orchestration)

- Moved: apps/code/src/main/services/updates/{service,schemas,test}.ts -> packages/core/src/updates/{updates,schemas,updates.test}.ts
- Registered: updatesCoreModule (UPDATES_SERVICE); new UPDATE_LIFECYCLE_PORT + UPDATES_LOGGER
- Data: source of truth is the UpdatesService state machine (idle/checking/downloading/ready/installing/error) over platform UPDATER/APP_LIFECYCLE/APP_META/MAIN_WINDOW interfaces; updateStore is a subscription projection
- Cleaned: extends @posthog/shared TypedEventEmitter (no node:events); inverted the update-quit handoff behind UPDATE_LIFECYCLE_PORT; logger via injected SagaLogger; isDevBuild->appMeta.isProduction; added vitest to packages/core
- Bridge: MAIN_TOKENS.UpdatesService toService(UPDATES_SERVICE) + UPDATE_LIFECYCLE_PORT toService(MAIN_TOKENS.AppLifecycleService) until menu/index/router migrate
- Validation: core tests 66; pnpm typecheck 19/19; apps/code tests 1329; dev:code boot clean

## 2026-05-29 - auth-core (AuthService -> packages/core)

- Moved: `apps/code/src/main/services/auth/service.ts` (AuthService) -> `packages/core/src/auth/auth.ts`
- Registered: AUTH_PREFERENCE/SESSION/OAUTH_FLOW/CONNECTIVITY/TOKEN_CIPHER ports (packages/core/src/auth/ports.ts); auth.module.ts; WORKBENCH_LOGGER bound in main
- Data: AuthService owns session/refresh truth; ws-server drizzle rows mapped to core domain records (AuthSessionRecord/AuthPreferenceRecord) in desktop adapters
- Cleaned: removed the forbidden ws-server/electron coupling from the auth business logic; OAuth host flow behind OAUTH_FLOW_PORT (OAuthService stays the Electron adapter)
- Bridge: `apps/code/src/main/services/auth/service.ts` re-exports `@posthog/core/auth/auth` until consumers import it directly
- Validation: full typecheck 19/19; apps/code 1292 tests; core auth 18 tests

## 2026-05-29 — enrichment (EnrichmentService -> core)

- Moved: `apps/code/src/main/services/enrichment/{service,detectPosthogInstallState.test,findStaleFlagSuggestions.test}.ts` -> `packages/core/src/enrichment/{enrichment,detectPosthogInstallState.test,findStaleFlagSuggestions.test}.ts` + ports.ts, identifiers.ts, enrichment.module.ts.
- Registered: `enrichmentModule` (binds ENRICHMENT_SERVICE); hosted in apps/code container. Ports: ENRICHMENT_AUTH (AuthService), ENRICHMENT_FILE_READER (node fs + @posthog/git listFilesContainingText), ENRICHMENT_LOGGER. core consumes @posthog/enricher directly (added to core deps; @posthog/git devDep for tests).
- Cleaned: core stays fs/git-free behind the file-reader port; auth behind a minimal port shape.
- Bridge: `MAIN_TOKENS.EnrichmentService -> ENRICHMENT_SERVICE`; router repointed to @posthog/core/enrichment.
- Validation: core typecheck clean; 19/19 enrichment tests in core (real git + tree-sitter + fetch mocks); apps/code zero enrichment errors.

## 2026-05-30 - task/inbox/new-task link services -> core
- Moved: `TaskLinkService`/`InboxLinkService`/`NewTaskLinkService` -> `packages/core/src/links/*` (+ `identifiers.ts` LinkLogger + per-service logger tokens). Tests moved too (39 pass).
- Registered: container binds `MAIN_TOKENS.{Task,Inbox,NewTask}LinkService` to the core classes + the logger tokens to `logger.scope(...)`; index/deep-link-router/notification repoint to core.
- Data: services inject DEEP_LINK + MAIN_WINDOW platform ports + injected logger; TypedEventEmitter + deep-link utils from shared. No AuthService coupling.
- Validation: core links 39 tests; apps/code node+web 0 errors.

## 2026-05-29 — mcp-apps (McpAppsService -> core)

- Moved: `apps/code/src/main/services/mcp-apps/service.ts` -> `packages/core/src/mcp-apps/mcp-apps.ts`; `apps/code/src/shared/types/mcp-apps.ts` -> `packages/core/src/mcp-apps/schemas.ts` (+ identifiers.ts, ports.ts, mcp-apps.module.ts).
- Registered: `mcpAppsModule` (binds MCP_APPS_SERVICE); hosted in apps/code container. Injects URL_LAUNCHER_SERVICE + MCP_APPS_LOGGER; local TypedEventEmitter. Added @modelcontextprotocol/sdk + ext-apps to core deps.
- Cleaned: apps/code @shared/types/mcp-apps -> `export *` re-export from core (renderer + router unchanged); menu.ts + agent type-imports repointed.
- Bridge: `MAIN_TOKENS.McpAppsService -> MCP_APPS_SERVICE`.
- Validation: core typecheck clean; apps/code zero mcp errors (remaining red exogenous: posthog-plugin migration). App smoke pending.

## 2026-05-29 - posthog-plugin (workspace-server capability)

- Moved: apps/code/src/main/services/posthog-plugin/* + utils/extract-zip.ts -> packages/workspace-server/src/services/posthog-plugin/*
- Registered: posthogPluginModule (POSTHOG_PLUGIN_SERVICE); POSTHOG_PLUGIN_LOGGER; added fflate dep
- Data: source of truth is the runtime plugin/skills dirs under appDataPath; PosthogPluginService orchestrates download+overlay+codex-sync via UpdateSkillsSaga
- Cleaned: extends @posthog/shared TypedEventEmitter; captureException via platform ANALYTICS_SERVICE; isDevBuild->appMeta.isProduction; logger via injected SagaLogger
- Bridge: MAIN_TOKENS.PosthogPluginService toService(POSTHOG_PLUGIN_SERVICE) until index/skills/agent inject directly
- Validation: ws-server typecheck + 27 tests; apps/code+core typecheck 0; dev:code boot 'Saga completed successfully'

## 2026-05-29 — external-apps (ExternalAppsService -> workspace-server)

- Moved: `apps/code/src/main/services/external-apps/{service,schemas,types}.ts` -> `packages/workspace-server/src/services/external-apps/{external-apps,schemas,types}.ts` + identifiers.ts, ports.ts, external-apps.module.ts.
- Registered: `externalAppsModule` (binds EXTERNAL_APPS_SERVICE); hosted in apps/code container. Injects CLIPBOARD_SERVICE + FILE_ICON_SERVICE + EXTERNAL_APPS_STORE port (electron-store bound in apps/code). Dropped getPrefsStore() (unused) + STORAGE_PATHS (only fed the store). DetectedApplication/ExternalAppType from ./schemas (no @shared barrel dep).
- Bridge: `MAIN_TOKENS.ExternalAppsService -> EXTERNAL_APPS_SERVICE` (CONTEXT_MENU_EXTERNAL_APPS_PORT resolves through it); router + index.ts repointed.
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — llm-gateway (LlmGatewayService -> core)

- Moved: `apps/code/src/main/services/llm-gateway/{service,schemas}.ts` -> `packages/core/src/llm-gateway/{llm-gateway,schemas}.ts` + ports.ts, identifiers.ts, llm-gateway.module.ts.
- Registered: `llmGatewayModule`; hosted in apps/code container. Ports keep core @posthog/agent-free: LLM_GATEWAY_AUTH (AuthService getValidAccessToken+authenticatedFetch), LLM_GATEWAY_ENDPOINTS (apps/code supplies @posthog/agent URL helpers + DEFAULT_GATEWAY_MODEL), LLM_GATEWAY_LOGGER.
- Cleaned: apps/code llm-gateway/schemas.ts -> `export *` re-export from core (renderer billing type consumers unchanged); git/service + router repointed.
- Bridge: `MAIN_TOKENS.LlmGatewayService -> LLM_GATEWAY_SERVICE`.
- Validation: core typecheck clean; apps/code zero llm-gateway errors (remaining red exogenous: GitFileStatus shared migration).

## 2026-05-29 — auth-callback-server (dev OAuth HTTP server -> workspace-server)

- Moved: the dev HTTP callback server from `apps/code/src/main/services/oauth/service.ts` -> `packages/workspace-server/src/services/oauth-callback/oauth-callback.ts` (OAuthCallbackServer.waitForCode owns http.Server/listen/connections/timeout/HTML; cancel via AbortSignal).
- Registered: `oauthCallbackModule` (binds OAUTH_CALLBACK_SERVER); loaded in apps/code container.
- Refactored: OAuthService (stays in apps/code) injects OAUTH_CALLBACK_SERVER; waitForHttpCallback delegates; pendingFlow uses an AbortController; getCallbackHtml/cleanupHttpServer/node:http removed. Deep-link prod path + PKCE + token exchange unchanged.
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — mcp-callback (dev MCP-OAuth HTTP server -> workspace-server)

- Moved: dev HTTP callback server from `apps/code/src/main/services/mcp-callback/service.ts` -> `packages/workspace-server/src/services/mcp-callback/mcp-callback-server.ts` (McpCallbackServer.waitForCallback -> URLSearchParams; owns http.Server/timeout/connections/HTML; cancel via AbortSignal; `successWhen` predicate picks success/error HTML).
- Registered: `mcpCallbackModule` (MCP_CALLBACK_SERVER); loaded in apps/code container.
- Refactored: McpCallbackService (apps/code) injects MCP_CALLBACK_SERVER, delegates; pendingCallback uses AbortController; getCallbackHtml/cleanupHttpServer/node:http removed. Deep-link prod path + events unchanged.
- Validation: full `pnpm typecheck` 19/19 green. Same pattern as auth-callback-server.

## 2026-05-29 — os (OsService -> workspace-server)

- Moved: `apps/code/src/main/services/os/{service,schemas}.ts` -> `packages/workspace-server/src/services/os/{os,schemas}.ts` + identifiers, os.module.ts.
- Registered: `osModule` (OS_SERVICE); hosted in apps/code container. Injects only platform services (DIALOG/URL_LAUNCHER/APP_META/IMAGE_PROCESSOR/WORKSPACE_SETTINGS) + node fs/os/path + @posthog/shared image utils.
- Bridge: `MAIN_TOKENS.OsService -> OS_SERVICE`; os router repointed (service + schemas).
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — cloud-task (CloudTaskService -> core)

- Moved: `apps/code/src/main/services/cloud-task/*` -> `packages/core/src/cloud-task/{cloud-task,schemas,cloud-task-types,sse-parser}.ts` + ports/identifiers/module + tests.
- Registered: `cloudTaskModule`; hosted in apps/code container. CLOUD_TASK_AUTH port (AuthService.authenticatedFetch) + CLOUD_TASK_LOGGER. @posthog/shared TypedEventEmitter + StoredLogEntry/TaskRunStatus. SseEventParser logger decoupled (onWarn callback).
- Data: CloudTask* update types kept as a core copy (cloud-task-types.ts) pending the concurrent shared-domain-types relocation landing in the @posthog/shared index barrel.
- Bridge: `MAIN_TOKENS.CloudTaskService -> CLOUD_TASK_SERVICE`; router + handoff repointed.
- Validation: full `pnpm typecheck` 19/19 green; cloud-task.test 22/22 + sse-parser 3/3 in core.

## 2026-05-29 — shell (ShellService -> workspace-server)

- Moved: `apps/code/src/main/services/shell/{service,schemas}.ts` -> `packages/workspace-server/src/services/shell/{shell,schemas}.ts` + identifiers/ports/module. pty = ws-server host concern.
- Registered: `shellModule` (SHELL_SERVICE); hosted in apps/code container. Injects PROCESS_TRACKING + repos + WORKSPACE_SETTINGS (inlined deriveWorktreePath) + SHELL_LOGGER. @posthog/shared TypedEventEmitter + ws-server buildWorkspaceEnv. Added node-pty to ws-server deps.
- Bridge: `MAIN_TOKENS.ShellService -> SHELL_SERVICE`; shell + agent routers repointed.
- Validation: ws-server + core + apps/code typecheck clean (ui red is exogenous).

## 2026-05-29 — ui-service (UIService -> core)

- Moved: `apps/code/src/main/services/ui/{service,schemas}.ts` -> `packages/core/src/ui/{ui,schemas}.ts` + identifiers/ports/module. UI command event relay (menu->renderer) over @posthog/shared TypedEventEmitter; UI_AUTH port (test-only token invalidation).
- Bridge: `MAIN_TOKENS.UIService -> UI_SERVICE`; menu.ts + ui router repointed.
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — oauth (OAuthService -> core)

- Moved: `apps/code/src/main/services/oauth/{service,schemas}.ts` -> `packages/core/src/oauth/{oauth,schemas}.ts` + identifiers/ports/module. PKCE flow orchestration.
- Registered: `oauthModule`; hosted in apps/code container. Platform deps (DEEP_LINK/URL_LAUNCHER/MAIN_WINDOW) + OAUTH_CALLBACK port (-> ws-server OAuthCallbackServer) + OAUTH_ENV {isDev} + OAUTH_LOGGER. oauth constants/backoff/urls from @posthog/shared.
- Bridge: `MAIN_TOKENS.OAuthService -> OAUTH_SERVICE`; router/index/port-adapters repointed.
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — bridge retirements (6 temporary MAIN_TOKENS bridges removed)

- Retired MAIN_TOKENS.{OsService, FoldersService, ArchiveService, UsageMonitorService, EnrichmentService, UIService} — consumers (routers + menu.ts) now inject the package identifiers (OS_SERVICE, FOLDERS_SERVICE, ARCHIVE_SERVICE, USAGE_MONITOR_SERVICE, ENRICHMENT_SERVICE, UI_SERVICE) directly; the `.toService` bridges + MAIN_TOKENS tokens deleted. The documented final migration step for these ported services.
- Remaining MAIN_TOKENS service bridges (LlmGateway, CloudTask, Suspension, McpApps) stay until their cross-service injectors in the agent/workspace/handoff tangle migrate.
- Validation: full `pnpm typecheck` 19/19 green.

## 2026-05-29 — bridge retirements (3 more: Shell, AuthProxy, McpProxy)

- Retired MAIN_TOKENS.{ShellService, AuthProxyService, McpProxyService}. Consumers were routers/adapters, NOT the tangle classes: shell + agent routers (container.get) -> SHELL_SERVICE; agent/auth-adapter (@inject) -> AUTH_PROXY_SERVICE + MCP_PROXY_SERVICE. `.toService` bridges + MAIN_TOKENS tokens deleted; *_AUTH/*_LOGGER port bindings + ws-server modules kept.
- 9 bridges retired total this session. Validation: apps/code typecheck clean.

## 2026-05-29 — DECISION: do not import @posthog/agent into core

- handoff/AgentService are blocked on @posthog/agent coupling (runtime resumeFromLog + agent type signatures). DECISION: do NOT make @posthog/agent a core dependency (would break core's host-agnostic web/mobile purpose; the SDK is Node/process-coupled), and do NOT touch the @posthog/agent package now.
- Consequence: handoff + AgentService stay in apps/code (desktop host services, not core slices) until a later agent-package split extracts pure types/utils to @posthog/shared and injects the runtime via ports.

## 2026-05-30 - terminal feature -> packages/ui (complete)
- Moved: `apps/code/src/renderer/features/terminal/*` (TerminalManager 514LOC, terminalStore, resolveTerminalFontFamily, Terminal/ShellTerminal/ActionTerminal components) -> `packages/ui/features/terminal/`.
- Registered: `ShellClient` port (`packages/ui/features/terminal/shellClient.ts`, incl. onData/onExit subscription methods) + apps/code `shellClientAdapter` wrapping trpcClient.shell.* + os.openExternal, registered at boot in main.tsx.
- Cleaned: components now subscribe via the imperative port in useEffect (no trpcReact); service/store use getShellClient(); logger/platform via @posthog/ui ports; xterm added to ui deps.
- Bridge: none — fully ported. Shell output subscriptions flow through the ShellClient port.
- Validation: apps web 0, node 0; ui terminal test 7/7; full ui sweep 157.

## 2026-05-30 - sessions store/hook/util layer -> packages/ui
- Moved: @utils/{session,promptContent}, features/sessions/{hooks/useSession,stores/sessionStore} -> packages/ui/features/sessions/* (path/session-events types via @posthog/shared; PermissionRequest/UserMessageAttachment via ui session types; ACP via ui dep).
- Cleaned: removed apps/code @utils/session + @utils/promptContent + the sessions hooks/stores dirs. sessionStore was unblocked by relocating its util chain bottom-up.
- Bridge: sessions COMPONENTS (SessionView etc.) remain in apps/code (trpcReact); convert via the imperative-port + useEffect pattern next.
- Validation: apps web 0, node 0; ui 186 tests.
