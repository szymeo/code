export interface IDevHostActions {
  openPath(path: string): Promise<void>;
  reloadAllWindows(): void;
  relaunch(): void;
  crash(): void;
}
