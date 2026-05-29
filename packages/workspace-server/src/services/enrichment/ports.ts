export interface EnrichmentAuthState {
  status: string;
  projectId: number | null;
  cloudRegion: string | null;
}

export interface EnrichmentAccessToken {
  accessToken: string;
  apiHost: string;
}

export interface EnrichmentAuth {
  getState(): EnrichmentAuthState;
  getValidAccessToken(): Promise<EnrichmentAccessToken>;
}

export interface EnrichmentFileReader {
  stat(path: string): Promise<{ size: number }>;
  readFile(path: string): Promise<string>;
  listFilesContainingText(repoPath: string, text: string): Promise<string[]>;
}

export interface EnrichmentLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
