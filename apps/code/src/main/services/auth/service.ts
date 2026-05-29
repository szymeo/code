// PORT NOTE: bridge to @posthog/core auth. The AuthService implementation now
// lives in packages/core/src/auth/auth.ts and is bound to MAIN_TOKENS.AuthService
// in the main container (with its ports bound to the desktop adapters in
// port-adapters.ts). This re-export keeps existing `import type { AuthService }`
// consumers working. Delete when consumers import @posthog/core/auth/auth directly.
export { AuthService } from "@posthog/core/auth/auth";
