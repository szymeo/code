import { TypedEventEmitter } from "@posthog/shared";
import { injectable } from "inversify";
import {
  ConnectivityEvent,
  type ConnectivityEvents,
  type ConnectivityStatusOutput,
} from "./schemas";

const CHECK_URL = "https://www.google.com/generate_204";
const CHECK_TIMEOUT_MS = 5_000;
const MIN_POLL_INTERVAL_MS = 3_000;
const MAX_POLL_INTERVAL_MS = 10_000;
const ONLINE_POLL_INTERVAL_MS = 3_000;
const OFFLINE_BACKOFF_MULTIPLIER = 1.5;

@injectable()
export class ConnectivityService extends TypedEventEmitter<ConnectivityEvents> {
  private isOnline = true;
  private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private offlinePollAttempt = 0;

  constructor() {
    super();
    this.setMaxListeners(0);
    void this.checkConnectivity();
    this.startPolling();
  }

  getStatus(): ConnectivityStatusOutput {
    return { isOnline: this.isOnline };
  }

  async checkNow(): Promise<ConnectivityStatusOutput> {
    await this.checkConnectivity();
    return { isOnline: this.isOnline };
  }

  stop(): void {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
  }

  statusChangeEvents(
    signal: AbortSignal | undefined,
  ): AsyncIterable<ConnectivityStatusOutput> {
    return this.toIterable(ConnectivityEvent.StatusChange, { signal });
  }

  private setOnline(online: boolean): void {
    if (this.isOnline === online) return;
    this.isOnline = online;
    this.emit(ConnectivityEvent.StatusChange, { isOnline: online });
    this.offlinePollAttempt = 0;
  }

  private async checkConnectivity(): Promise<void> {
    this.setOnline(await this.verifyWithHttp());
  }

  private async verifyWithHttp(): Promise<boolean> {
    try {
      const response = await fetch(CHECK_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  }

  private startPolling(): void {
    if (this.pollTimeoutId) return;
    this.offlinePollAttempt = 0;
    this.schedulePoll();
  }

  private schedulePoll(): void {
    const interval = this.isOnline
      ? ONLINE_POLL_INTERVAL_MS
      : Math.min(
          MIN_POLL_INTERVAL_MS *
            OFFLINE_BACKOFF_MULTIPLIER ** this.offlinePollAttempt,
          MAX_POLL_INTERVAL_MS,
        );

    this.pollTimeoutId = setTimeout(async () => {
      this.pollTimeoutId = null;
      const wasOffline = !this.isOnline;
      await this.checkConnectivity();
      if (!this.isOnline && wasOffline) {
        this.offlinePollAttempt++;
      }
      this.schedulePoll();
    }, interval);
    this.pollTimeoutId.unref?.();
  }
}
