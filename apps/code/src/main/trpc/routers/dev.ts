import { z } from "zod";
import { getService } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import type { AgentService } from "../../services/agent/service";
import {
  DevActionsEvent,
  type DevActionsEvents,
  devToastInput,
  devToastSchema,
} from "../../services/dev-actions/schemas";
import type { DevActionsService } from "../../services/dev-actions/service";
import {
  type DevFlags,
  DevFlagsEvent,
  type DevFlagsEvents,
  devFlagsSchema,
} from "../../services/dev-flags/schemas";
import type { DevFlagsService } from "../../services/dev-flags/service";
import {
  DevLogsEvent,
  type DevLogsEvents,
  logsSnapshotSchema,
} from "../../services/dev-logs/schemas";
import type { DevLogsService } from "../../services/dev-logs/service";
import {
  DevMetricsEvent,
  type DevMetricsEvents,
  metricsSampleSchema,
} from "../../services/dev-metrics/schemas";
import type { DevMetricsService } from "../../services/dev-metrics/service";
import {
  DevNetworkEvent,
  type DevNetworkEvents,
  networkSimSchema,
  networkSnapshotSchema,
} from "../../services/dev-network/schemas";
import type { DevNetworkService } from "../../services/dev-network/service";
import { publicProcedure, router } from "../trpc";

const getFlagsService = () =>
  getService<DevFlagsService>(MAIN_TOKENS.DevFlagsService);
const getMetricsService = () =>
  getService<DevMetricsService>(MAIN_TOKENS.DevMetricsService);
const getNetworkService = () =>
  getService<DevNetworkService>(MAIN_TOKENS.DevNetworkService);
const getLogsService = () =>
  getService<DevLogsService>(MAIN_TOKENS.DevLogsService);
const getActionsService = () =>
  getService<DevActionsService>(MAIN_TOKENS.DevActionsService);
const getAgentService = () =>
  getService<AgentService>(MAIN_TOKENS.AgentService);

const agentSessionSchema = z.object({
  taskRunId: z.string(),
  taskId: z.string(),
  repoPath: z.string(),
  adapter: z.string(),
  model: z.string().nullable(),
  sessionId: z.string().nullable(),
  channel: z.string(),
  createdAt: z.number(),
  lastActivityAt: z.number(),
  promptPending: z.boolean(),
  inFlightToolCalls: z.number(),
  idleDeadline: z.number().nullable(),
});

const agentSnapshotSchema = z.object({
  sessions: z.array(agentSessionSchema),
  pendingPermissions: z.array(
    z.object({
      taskRunId: z.string(),
      toolCallId: z.string(),
    }),
  ),
});

export const devRouter = router({
  getFlags: publicProcedure.output(devFlagsSchema).query((): DevFlags => {
    return getFlagsService().getFlags();
  }),

  setDevMode: publicProcedure
    .input(z.object({ enabled: z.boolean() }))
    .output(devFlagsSchema)
    .mutation(({ input }) => getFlagsService().setDevMode(input.enabled)),

  getLastMetrics: publicProcedure
    .output(metricsSampleSchema.nullable())
    .query(() => getMetricsService().getLastSample()),

  getNetworkRequests: publicProcedure
    .output(networkSnapshotSchema)
    .query(() => ({ requests: getNetworkService().getSnapshot() })),

  clearNetworkRequests: publicProcedure.mutation(() => {
    getNetworkService().clear();
    return { ok: true };
  }),

  getNetworkSim: publicProcedure
    .output(networkSimSchema)
    .query(() => getNetworkService().getSim()),

  setNetworkSim: publicProcedure
    .input(networkSimSchema.partial())
    .output(networkSimSchema)
    .mutation(({ input }) => getNetworkService().setSim(input)),

  getLogs: publicProcedure
    .output(logsSnapshotSchema)
    .query(() => ({ entries: getLogsService().getSnapshot() })),

  clearLogs: publicProcedure.mutation(() => {
    getLogsService().clear();
    return { ok: true };
  }),

  getAgentsSnapshot: publicProcedure
    .output(agentSnapshotSchema)
    .query(() => getAgentService().getDebugSnapshot()),

  openUserDataDir: publicProcedure.mutation(async () => {
    await getActionsService().openUserDataDir();
    return { ok: true };
  }),

  openLogFile: publicProcedure.mutation(async () => {
    await getActionsService().openLogFile();
    return { ok: true };
  }),

  reloadRenderer: publicProcedure.mutation(() => {
    getActionsService().reloadRenderer();
    return { ok: true };
  }),

  restartMain: publicProcedure.mutation(() => {
    getActionsService().restartMain();
    return { ok: true };
  }),

  crashMain: publicProcedure.mutation(() => {
    getActionsService().crashMain();
    return { ok: true };
  }),

  triggerToast: publicProcedure
    .input(devToastInput)
    .output(devToastSchema)
    .mutation(({ input }) =>
      getActionsService().triggerToast(input.variant, input.message),
    ),

  onFlagsChanged: publicProcedure.subscription(async function* (opts) {
    const service = getFlagsService();
    const event: keyof DevFlagsEvents = DevFlagsEvent.Changed;
    for await (const data of service.toIterable(event, {
      signal: opts.signal,
    })) {
      yield data;
    }
  }),

  onMetrics: publicProcedure.subscription(async function* (opts) {
    const service = getMetricsService();
    service.acquireSampler();
    try {
      const event: keyof DevMetricsEvents = DevMetricsEvent.Sample;
      for await (const data of service.toIterable(event, {
        signal: opts.signal,
      })) {
        yield data;
      }
    } finally {
      service.releaseSampler();
    }
  }),

  onNetworkRequest: publicProcedure.subscription(async function* (opts) {
    const service = getNetworkService();
    const event: keyof DevNetworkEvents = DevNetworkEvent.Request;
    for await (const data of service.toIterable(event, {
      signal: opts.signal,
    })) {
      yield data;
    }
  }),

  onNetworkSimChanged: publicProcedure.subscription(async function* (opts) {
    const service = getNetworkService();
    const event: keyof DevNetworkEvents = DevNetworkEvent.SimChanged;
    for await (const data of service.toIterable(event, {
      signal: opts.signal,
    })) {
      yield data;
    }
  }),

  onLogEntry: publicProcedure.subscription(async function* (opts) {
    const service = getLogsService();
    const event: keyof DevLogsEvents = DevLogsEvent.Entry;
    for await (const data of service.toIterable(event, {
      signal: opts.signal,
    })) {
      yield data;
    }
  }),

  onDevToast: publicProcedure.subscription(async function* (opts) {
    const service = getActionsService();
    const event: keyof DevActionsEvents = DevActionsEvent.Toast;
    for await (const data of service.toIterable(event, {
      signal: opts.signal,
    })) {
      yield data;
    }
  }),
});
