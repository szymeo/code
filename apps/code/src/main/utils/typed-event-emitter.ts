// PORT NOTE: re-export of the single TypedEventEmitter impl, now owned by
// @posthog/shared (browser-safe, so packages/core can consume it too). Kept as a
// bridge so the ~24 main services + ~20 tRPC subscription routers that import
// from "@main/utils/typed-event-emitter" stay unchanged. Retire by repointing
// those imports to "@posthog/shared" per their feature slices.
export { TypedEventEmitter } from "@posthog/shared";
