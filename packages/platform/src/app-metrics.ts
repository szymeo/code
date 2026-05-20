export interface AppProcessMetric {
  pid: number;
  type: string;
  name?: string;
  cpu?: { percentCPUUsage: number };
  memory?: { workingSetSize: number };
}

export interface IAppMetrics {
  getAppMetrics(): AppProcessMetric[];
}
