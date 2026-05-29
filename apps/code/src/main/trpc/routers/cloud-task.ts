import { container } from "../../di/container";
import { CLOUD_TASK_SERVICE } from "@posthog/core/cloud-task/identifiers";
import {
  CloudTaskEvent,
  onUpdateInput,
  retryInput,
  sendCommandInput,
  sendCommandOutput,
  unwatchInput,
  watchInput,
} from "@posthog/core/cloud-task/schemas";
import type { CloudTaskService } from "@posthog/core/cloud-task/cloud-task";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<CloudTaskService>(CLOUD_TASK_SERVICE);

export const cloudTaskRouter = router({
  watch: publicProcedure
    .input(watchInput)
    .mutation(({ input }) => getService().watch(input)),

  unwatch: publicProcedure
    .input(unwatchInput)
    .mutation(({ input }) => getService().unwatch(input.taskId, input.runId)),

  retry: publicProcedure
    .input(retryInput)
    .mutation(({ input }) => getService().retry(input.taskId, input.runId)),

  sendCommand: publicProcedure
    .input(sendCommandInput)
    .output(sendCommandOutput)
    .mutation(({ input }) => getService().sendCommand(input)),

  onUpdate: publicProcedure
    .input(onUpdateInput)
    .subscription(async function* (opts) {
      const service = getService();
      try {
        for await (const data of service.toIterable(CloudTaskEvent.Update, {
          signal: opts.signal,
        })) {
          if (
            data.taskId === opts.input.taskId &&
            data.runId === opts.input.runId
          ) {
            yield data;
          }
        }
      } finally {
        service.unwatch(opts.input.taskId, opts.input.runId);
      }
    }),
});
