import "reflect-metadata";
// Side effect: registers the host (electron-trpc-backed) storage with @posthog/ui
// before any persisted store hydrates.
import "@utils/electronStorage";
// Side effect: registers the host CloneClient with @posthog/ui.
import "@features/clone/cloneClientAdapter";
import "@features/connectivity/connectivityClientAdapter";
import "@features/updates-client/updatesClientAdapter";
import "@features/terminal-client/shellClientAdapter";
import "@features/focus-client/focusClientAdapter";
// Side effect: attaches window focus/visibility listeners so `focused` is accurate before inbox queries mount.
import "@posthog/ui/workbench/rendererWindowFocusStore";
import { Providers } from "@components/Providers";
import { preloadHighlighter } from "@pierre/diffs";
import { startWorkbench } from "@posthog/di/contribution";
import { ServiceProvider } from "@posthog/di/react";
import App from "@renderer/App";
import { registerDesktopContributions } from "@renderer/desktop-contributions";
import { container } from "@renderer/di/container";
import "@renderer/desktop-services";
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/globals.css";

void preloadHighlighter({
  themes: ["github-dark", "github-light"],
  langs: [
    "typescript",
    "tsx",
    "javascript",
    "jsx",
    "json",
    "css",
    "html",
    "markdown",
    "python",
    "ruby",
    "go",
    "rust",
    "shell",
    "yaml",
    "sql",
  ],
});

// HACK(@posthog/hedgehog-mode): The package bundles react-dom 18 code that
// accesses React 18 internals at module scope. React 19 moved these to
// __CLIENT_INTERNALS and removed the old names. Shim the old structure so the
// bundled code doesn't crash on import.
// Remove once hedgehog-mode ships a React 19 compatible build.
{
  const r = React as unknown as Record<string, unknown>;
  if (!r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {};
  }
  const internals =
    r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<
      string,
      unknown
    >;
  if (!internals.ReactCurrentDispatcher) {
    internals.ReactCurrentDispatcher = { current: null };
  }
  if (!internals.ReactCurrentOwner) {
    internals.ReactCurrentOwner = { current: null };
  }
  if (!internals.ReactDebugCurrentFrame) {
    internals.ReactDebugCurrentFrame = { getCurrentStack: null };
  }
}

document.title = import.meta.env.DEV
  ? "PostHog Code (Development)"
  : "PostHog Code";

registerDesktopContributions();
void startWorkbench(container);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ServiceProvider container={container}>
      <Providers>
        <App />
      </Providers>
    </ServiceProvider>
  </React.StrictMode>,
);
