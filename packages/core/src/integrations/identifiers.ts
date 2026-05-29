export interface IntegrationLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export const GITHUB_INTEGRATION_SERVICE = Symbol.for(
  "posthog.core.githubIntegrationService",
);

export const LINEAR_INTEGRATION_SERVICE = Symbol.for(
  "posthog.core.linearIntegrationService",
);

export const SLACK_INTEGRATION_SERVICE = Symbol.for(
  "posthog.core.slackIntegrationService",
);

export const GITHUB_INTEGRATION_LOGGER = Symbol.for(
  "posthog.core.githubIntegrationLogger",
);

export const SLACK_INTEGRATION_LOGGER = Symbol.for(
  "posthog.core.slackIntegrationLogger",
);
