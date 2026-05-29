import { z } from "zod";

export const readLocalLogsInput = z.object({ taskRunId: z.string().min(1) });
export const readLocalLogsOutput = z.string().nullable();

export const writeLocalLogsInput = z.object({
  taskRunId: z.string().min(1),
  content: z.string(),
});
