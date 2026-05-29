import { container } from "../../di/container";
import { LLM_GATEWAY_SERVICE } from "@posthog/core/llm-gateway/identifiers";
import { promptInput, promptOutput } from "@posthog/core/llm-gateway/schemas";
import type { LlmGatewayService } from "@posthog/core/llm-gateway/llm-gateway";
import { publicProcedure, router } from "../trpc";

const getService = () => container.get<LlmGatewayService>(LLM_GATEWAY_SERVICE);

export const llmGatewayRouter = router({
  prompt: publicProcedure
    .input(promptInput)
    .output(promptOutput)
    .mutation(({ input }) =>
      getService().prompt(input.messages, {
        system: input.system,
        maxTokens: input.maxTokens,
        model: input.model,
      }),
    ),

  invalidatePlanCache: publicProcedure.mutation(() =>
    getService().invalidatePlanCache(),
  ),
});
