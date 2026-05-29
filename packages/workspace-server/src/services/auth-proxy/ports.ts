export interface AuthProxyAuth {
  authenticatedFetch(url: string, init?: RequestInit): Promise<Response>;
}

export interface AuthProxyLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
