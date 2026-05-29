import type { UsageOutput } from "./schemas";

export interface UsageGateway {
  fetchUsage(): Promise<UsageOutput>;
}

export interface UsageActivityMonitor {
  onLlmActivity(listener: () => void): void;
  offLlmActivity(listener: () => void): void;
  hasActiveSessions(): boolean;
}

export interface ThresholdStore {
  getThresholdsSeen(): Record<string, string>;
  setThresholdsSeen(value: Record<string, string>): void;
}

export interface UsageLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
