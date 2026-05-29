export interface ScopedLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

export interface HostLogger extends ScopedLogger {
  scope(name: string): ScopedLogger;
}

let impl: HostLogger | null = null;

export function setLogger(hostLogger: HostLogger): void {
  impl = hostLogger;
}

function deferredScope(name: string): ScopedLogger {
  return {
    info: (...args) => impl?.scope(name).info(...args),
    warn: (...args) => impl?.scope(name).warn(...args),
    error: (...args) => impl?.scope(name).error(...args),
    debug: (...args) => impl?.scope(name).debug(...args),
  };
}

export const logger: HostLogger = {
  scope: (name) => deferredScope(name),
  info: (...args) => impl?.info(...args),
  warn: (...args) => impl?.warn(...args),
  error: (...args) => impl?.error(...args),
  debug: (...args) => impl?.debug(...args),
};
