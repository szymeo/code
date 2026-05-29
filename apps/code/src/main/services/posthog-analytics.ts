// PORT NOTE: bridge to @posthog/platform ANALYTICS_SERVICE. The implementation
// lives in apps/code/src/main/platform-adapters/posthog-analytics.ts and is
// bound to ANALYTICS_SERVICE in the main container. These free functions
// delegate to the shared adapter instance so existing call sites keep working.
// Retire when index.ts + analytics router + posthog-plugin/workspace/
// app-lifecycle services inject ANALYTICS_SERVICE directly.
import type { AnalyticsProperties } from "@posthog/platform/analytics";
import { posthogNodeAnalytics } from "../platform-adapters/posthog-analytics";

export function initializePostHog() {
  posthogNodeAnalytics.initialize();
}

export function setCurrentUserId(userId: string | null) {
  posthogNodeAnalytics.setCurrentUserId(userId);
}

export function getCurrentUserId() {
  return posthogNodeAnalytics.getCurrentUserId();
}

export function trackAppEvent(
  eventName: string,
  properties?: AnalyticsProperties,
) {
  posthogNodeAnalytics.track(eventName, properties);
}

export function identifyUser(userId: string, properties?: AnalyticsProperties) {
  posthogNodeAnalytics.identify(userId, properties);
}

export async function shutdownPostHog() {
  await posthogNodeAnalytics.shutdown();
}

export function resetUser() {
  posthogNodeAnalytics.resetUser();
}

export function captureException(
  error: unknown,
  additionalProperties?: Record<string, unknown>,
) {
  posthogNodeAnalytics.captureException(error, additionalProperties);
}

export async function flushAnalytics() {
  await posthogNodeAnalytics.flush();
}
