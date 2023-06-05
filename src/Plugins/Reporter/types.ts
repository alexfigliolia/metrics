import type { PluginTable, Status } from "Metrics/types";
import type { ReporterPlugin } from "./ReporterPlugin";
import type { Metric } from "Metrics/Metric";

export type WithReporter<
  T extends PluginTable = PluginTable,
  M extends Metric<any, any> = Metric<any, any>
> = T & {
  reporter: ReporterPlugin<M>;
};

export type RequestFormatter = (
  metrics: JSONMetric[]
) => XMLHttpRequestBodyInit;

export interface JSONMetric<T extends PluginTable = PluginTable> {
  name: string;
  startTime: number;
  stopTime: number;
  duration: number;
  plugins: T;
  status: Status;
}
