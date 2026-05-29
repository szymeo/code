// PORT NOTE: bridge to @posthog/core/integrations/schemas. Delete once
// github-integration + slack-integration services move to packages/core and
// import the integration flow schemas from there directly.
export {
  type CloudRegion,
  cloudRegion,
  type StartIntegrationFlowInput,
  startIntegrationFlowInput,
  type StartIntegrationFlowOutput,
  startIntegrationFlowOutput,
} from "@posthog/core/integrations/schemas";
