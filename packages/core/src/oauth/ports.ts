export interface OAuthCallbackReceiver {
  waitForCode(options: {
    port: number;
    timeoutMs: number;
    signal?: AbortSignal;
    onListening?: () => void;
  }): Promise<string>;
}

export interface OAuthEnv {
  readonly isDev: boolean;
}

export interface OAuthLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
