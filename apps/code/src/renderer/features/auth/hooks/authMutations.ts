// PORT NOTE: moved to @posthog/ui/features/auth/useAuthMutations (consumes
// AUTH_CLIENT + AUTH_SIDE_EFFECTS via useService). Re-exported so existing
// importers keep working; the cross-feature side effects are wired by the
// desktop RendererAuthSideEffects adapter. Delete when importers repoint.
export {
  useLoginMutation,
  useLogoutMutation,
  useRedeemInviteCodeMutation,
  useSelectProjectMutation,
  useSignupMutation,
} from "@posthog/ui/features/auth/useAuthMutations";
