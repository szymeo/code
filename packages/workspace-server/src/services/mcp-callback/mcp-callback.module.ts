import { ContainerModule } from "inversify";
import { MCP_CALLBACK_SERVER, MCP_CALLBACK_SERVICE } from "./identifiers";
import { McpCallbackServer } from "./mcp-callback-server";
import { McpCallbackService } from "./mcp-callback";

export const mcpCallbackModule = new ContainerModule(({ bind }) => {
  bind(MCP_CALLBACK_SERVER).to(McpCallbackServer).inSingletonScope();
  bind(MCP_CALLBACK_SERVICE).to(McpCallbackService).inSingletonScope();
});
