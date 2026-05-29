import { z } from "zod";
import { ENRICHMENT_SERVICE } from "@posthog/workspace-server/services/enrichment/identifiers";
import { container } from "../../di/container";
import type { EnrichmentService } from "@posthog/workspace-server/services/enrichment/enrichment";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<EnrichmentService>(ENRICHMENT_SERVICE);

const enrichFileInput = z.object({
  taskId: z.string(),
  filePath: z.string(),
  absolutePath: z.string().optional(),
  content: z.string(),
});

const detectPosthogInstallStateInput = z.object({
  repoPath: z.string(),
});

const detectPosthogInstallStateOutput = z.enum([
  "not_installed",
  "installed_no_init",
  "initialized",
]);

const findStaleFlagSuggestionsInput = z.object({
  repoPath: z.string(),
});

const staleFlagReference = z.object({
  file: z.string(),
  line: z.number(),
  method: z.string(),
});

const findStaleFlagSuggestionsOutput = z.array(
  z.object({
    flagKey: z.string(),
    references: z.array(staleFlagReference),
    referenceCount: z.number(),
  }),
);

export const enrichmentRouter = router({
  enrichFile: publicProcedure
    .input(enrichFileInput)
    .query(({ input }) => getService().enrichFile(input)),
  detectPosthogInstallState: publicProcedure
    .input(detectPosthogInstallStateInput)
    .output(detectPosthogInstallStateOutput)
    .query(({ input }) =>
      getService().detectPosthogInstallState(input.repoPath),
    ),
  findStaleFlagSuggestions: publicProcedure
    .input(findStaleFlagSuggestionsInput)
    .output(findStaleFlagSuggestionsOutput)
    .query(({ input }) =>
      getService().findStaleFlagSuggestions(input.repoPath),
    ),
});
