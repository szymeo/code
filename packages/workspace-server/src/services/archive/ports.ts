export interface ArchiveLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface SessionCanceller {
  cancelSessionsByTaskId(taskId: string): Promise<void>;
}

export interface ArchiveFileWatcher {
  stopWatching(worktreePath: string): Promise<void>;
}
