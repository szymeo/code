export interface ConnectivityStatus {
  isOnline: boolean;
}

export interface ConnectivityClient {
  checkNow(): Promise<ConnectivityStatus>;
  getStatus(): Promise<ConnectivityStatus>;
  onStatusChange(handlers: {
    onData: (status: ConnectivityStatus) => void;
    onError?: (error: unknown) => void;
  }): { unsubscribe: () => void };
}

let client: ConnectivityClient | null = null;

export function setConnectivityClient(impl: ConnectivityClient): void {
  client = impl;
}

export function getConnectivityClient(): ConnectivityClient {
  if (!client) {
    throw new Error("ConnectivityClient not registered by the host");
  }
  return client;
}
