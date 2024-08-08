import type { PluginTable, Status } from "Metrics/types";

export type RequestFormatter = (
  metrics: JSONMetric[],
) => XMLHttpRequestBodyInit;

export interface JSONMetric<T extends PluginTable = PluginTable> {
  name: string;
  startTime: number;
  stopTime: number;
  duration: number;
  plugins: T;
  status: Status;
}
