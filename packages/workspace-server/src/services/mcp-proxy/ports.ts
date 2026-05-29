export interface McpProxyAuth {
  authenticatedFetch(url: string, init?: RequestInit): Promise<Response>;
  refreshAccessToken(): Promise<unknown>;
}

export interface McpProxyLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
