export type CloneStatus = "cloning" | "complete" | "error";

export interface CloneProgressEvent {
  cloneId: string;
  status: CloneStatus;
  message: string;
}

export interface CloneRepositoryInput {
  repoUrl: string;
  targetPath: string;
  cloneId: string;
}

export interface CloneClient {
  cloneRepository(input: CloneRepositoryInput): Promise<void>;
  onCloneProgress(onData: (event: CloneProgressEvent) => void): {
    unsubscribe: () => void;
  };
}

let client: CloneClient | null = null;

export function setCloneClient(impl: CloneClient): void {
  client = impl;
}

export function getCloneClient(): CloneClient {
  if (!client) {
    throw new Error("CloneClient not registered by the host");
  }
  return client;
}
