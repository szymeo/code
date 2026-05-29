import {
  setShellClient,
  type ShellClient,
} from "@posthog/ui/features/terminal/shellClient";
import { trpcClient } from "@renderer/trpc/client";

// PORT NOTE: host adapter wiring the main electron-trpc shell + os.openExternal
// routes to the @posthog/ui ShellClient port so the terminal service/store stay
// host-agnostic. Shell output subscriptions (shell.onData/onExit) stay in the
// Terminal component via trpcReact until the React-trpc keystone lands.
const shellClient: ShellClient = {
  write: async (input) => {
    await trpcClient.shell.write.mutate(input);
  },
  check: (input) => trpcClient.shell.check.query(input),
  create: async (input) => {
    await trpcClient.shell.create.mutate(input);
  },
  createCommand: async (input) => {
    await trpcClient.shell.createCommand.mutate(input);
  },
  resize: async (input) => {
    await trpcClient.shell.resize.mutate(input);
  },
  getProcess: async (input) =>
    (await trpcClient.shell.getProcess.query(input)) ?? null,
  openExternal: async (input) => {
    await trpcClient.os.openExternal.mutate(input);
  },
  onData: (sessionId, onEvent) =>
    trpcClient.shell.onData.subscribe({ sessionId }, { onData: onEvent }),
  onExit: (sessionId, onEvent) =>
    trpcClient.shell.onExit.subscribe({ sessionId }, { onData: onEvent }),
};

setShellClient(shellClient);
