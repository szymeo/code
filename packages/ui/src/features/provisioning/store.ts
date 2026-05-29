import { create } from "zustand";

// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC is required to strip ANSI sequences
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}

function processOutput(lines: string[], chunk: string): string[] {
  const next = [...lines];
  const parts = chunk.split("\n");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const crSegments = part.split("\r");
    const lastSegment = crSegments[crSegments.length - 1];

    if (i === 0 && next.length > 0) {
      if (crSegments.length > 1) {
        next[next.length - 1] = lastSegment;
      } else {
        next[next.length - 1] += lastSegment;
      }
    } else {
      next.push(lastSegment);
    }
  }

  return next;
}

interface ProvisioningStoreState {
  activeTasks: Set<string>;
  output: Record<string, string[]>;
}

interface ProvisioningStoreActions {
  setActive: (taskId: string) => void;
  clear: (taskId: string) => void;
  isActive: (taskId: string) => boolean;
  appendChunk: (taskId: string, chunk: string) => void;
}

type ProvisioningStore = ProvisioningStoreState & ProvisioningStoreActions;

export const useProvisioningStore = create<ProvisioningStore>()((set, get) => ({
  activeTasks: new Set(),
  output: {},

  setActive: (taskId) =>
    set((state) => {
      const next = new Set(state.activeTasks);
      next.add(taskId);
      return { activeTasks: next };
    }),

  clear: (taskId) =>
    set((state) => {
      const next = new Set(state.activeTasks);
      next.delete(taskId);
      const { [taskId]: _removed, ...output } = state.output;
      return { activeTasks: next, output };
    }),

  isActive: (taskId) => get().activeTasks.has(taskId),

  appendChunk: (taskId, chunk) =>
    set((state) => ({
      output: {
        ...state.output,
        [taskId]: processOutput(state.output[taskId] ?? [], stripAnsi(chunk)),
      },
    })),
}));
