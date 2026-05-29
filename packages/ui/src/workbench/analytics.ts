import type { EventPropertyMap } from "@posthog/shared/analytics-events";

type TrackArgs<K extends keyof EventPropertyMap> =
  EventPropertyMap[K] extends never
    ? []
    : EventPropertyMap[K] extends undefined
      ? [properties?: EventPropertyMap[K]]
      : [properties: EventPropertyMap[K]];

type Tracker = <K extends keyof EventPropertyMap>(
  eventName: K,
  ...args: TrackArgs<K>
) => void;

let tracker: Tracker | null = null;

export function setTracker(fn: Tracker): void {
  tracker = fn;
}

export function track<K extends keyof EventPropertyMap>(
  eventName: K,
  ...args: TrackArgs<K>
): void {
  tracker?.(eventName, ...args);
}
