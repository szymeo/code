export interface UpdateStatusPayload {
  checking: boolean;
  downloading?: boolean;
  upToDate?: boolean;
  updateReady?: boolean;
  installing?: boolean;
  version?: string;
  error?: string;
}

export interface UpdateCheckResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

interface Subscriber<T> {
  onData: (data: T) => void;
  onError?: (error: unknown) => void;
}

export interface UpdatesClient {
  install(): Promise<{ installed: boolean }>;
  check(): Promise<UpdateCheckResult>;
  isEnabled(): Promise<{ enabled: boolean }>;
  getStatus(): Promise<UpdateStatusPayload>;
  onStatus(sub: Subscriber<UpdateStatusPayload>): { unsubscribe: () => void };
  onReady(sub: Subscriber<{ version: string | null }>): { unsubscribe: () => void };
  onCheckFromMenu(sub: Subscriber<void>): { unsubscribe: () => void };
}

let client: UpdatesClient | null = null;

export function setUpdatesClient(impl: UpdatesClient): void {
  client = impl;
}

export function getUpdatesClient(): UpdatesClient {
  if (!client) {
    throw new Error("UpdatesClient not registered by the host");
  }
  return client;
}
