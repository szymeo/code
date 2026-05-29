import { createJSONStorage, type StateStorage } from "zustand/middleware";

let rawStorage: StateStorage | null = null;

export function setRendererStorage(storage: StateStorage): void {
  rawStorage = storage;
}

const lazyStorage: StateStorage = {
  getItem: (key) => (rawStorage ? rawStorage.getItem(key) : null),
  setItem: (key, value) =>
    rawStorage ? rawStorage.setItem(key, value) : undefined,
  removeItem: (key) => (rawStorage ? rawStorage.removeItem(key) : undefined),
};

export const rendererSecureStore: StateStorage = lazyStorage;

export const electronStorage = createJSONStorage(() => lazyStorage);
