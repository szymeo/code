export interface ShellCreateInput {
  sessionId: string;
  cwd?: string;
  taskId?: string;
}

export interface ShellCreateCommandInput {
  sessionId: string;
  command: string;
  cwd: string;
  taskId?: string;
}

export interface ShellResizeInput {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface ShellClient {
  write(input: { sessionId: string; data: string }): Promise<void>;
  check(input: { sessionId: string }): Promise<boolean>;
  create(input: ShellCreateInput): Promise<void>;
  createCommand(input: ShellCreateCommandInput): Promise<void>;
  resize(input: ShellResizeInput): Promise<void>;
  getProcess(input: { sessionId: string }): Promise<string | null>;
  openExternal(input: { url: string }): Promise<void>;
  onData(
    sessionId: string,
    onEvent: (event: { sessionId: string; data: string }) => void,
  ): { unsubscribe: () => void };
  onExit(
    sessionId: string,
    onEvent: (event: { sessionId: string; exitCode: number | null }) => void,
  ): { unsubscribe: () => void };
}

let client: ShellClient | null = null;

export function setShellClient(impl: ShellClient): void {
  client = impl;
}

export function getShellClient(): ShellClient {
  if (!client) {
    throw new Error("ShellClient not registered by the host");
  }
  return client;
}
