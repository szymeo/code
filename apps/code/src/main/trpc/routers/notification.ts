import { z } from "zod";
import { container } from "../../di/container";
import { NOTIFICATION_SERVICE } from "@posthog/core/notification/identifiers";
import type { NotificationService } from "@posthog/core/notification/notification";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<NotificationService>(NOTIFICATION_SERVICE);

export const notificationRouter = router({
  send: publicProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string(),
        silent: z.boolean(),
        taskId: z.string().optional(),
      }),
    )
    .mutation(({ input }) =>
      getService().send(input.title, input.body, input.silent, input.taskId),
    ),
  showDockBadge: publicProcedure.mutation(() => getService().showDockBadge()),
  bounceDock: publicProcedure.mutation(() => getService().bounceDock()),
});
