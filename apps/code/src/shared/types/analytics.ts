// PORT NOTE: analytics event types/const moved to @posthog/shared/analytics-events.
// This shim re-exports them so existing @shared/types/analytics consumers keep
// working; retire once they import from @posthog/shared directly.
export * from "@posthog/shared/analytics-events";
