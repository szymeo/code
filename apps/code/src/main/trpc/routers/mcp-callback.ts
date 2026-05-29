import { container } from "../../di/container";
import {
  getCallbackUrlOutput,
  McpCallbackEvent,
  openAndWaitInput,
  openAndWaitOutput,
} from "@posthog/workspace-server/services/mcp-callback/schemas";
import { MCP_CALLBACK_SERVICE } from "@posthog/workspace-server/services/mcp-callback/identifiers";
import type { McpCallbackService } from "@posthog/workspace-server/services/mcp-callback/mcp-callback";
import { publicProcedure, router } from "../trpc";

const getService = () =>
  container.get<McpCallbackService>(MCP_CALLBACK_SERVICE);

export const mcpCallbackRouter = router({
  /**
   * Get the callback URL for MCP OAuth (dev: http://localhost:8238/..., prod: deep link via the app-registered URL scheme).
   * Call this before making the install_custom API call to PostHog.
   */
  getCallbackUrl: publicProcedure
    .output(getCallbackUrlOutput)
    .query(() => getService().getCallbackUrl()),

  /**
   * Open the OAuth authorization URL in the browser and wait for the callback.
   * Returns when the OAuth flow completes (success or error).
   */
  openAndWaitForCallback: publicProcedure
    .input(openAndWaitInput)
    .output(openAndWaitOutput)
    .mutation(({ input }) =>
      getService().openAndWaitForCallback(input.redirectUrl),
    ),

  /**
   * Subscribe to MCP OAuth completion events.
   * Useful for refreshing the installations list when a flow completes.
   */
  onOAuthComplete: publicProcedure.subscription(async function* (opts) {
    const service = getService();
    for await (const data of service.toIterable(
      McpCallbackEvent.OAuthComplete,
      { signal: opts.signal },
    )) {
      yield data;
    }
  }),
});
