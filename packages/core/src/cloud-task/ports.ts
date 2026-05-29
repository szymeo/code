export interface CloudTaskAuth {
  authenticatedFetch(url: string, init?: RequestInit): Promise<Response>;
}

export interface CloudTaskLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
