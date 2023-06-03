import type { PluginTable } from "Metrics/types";
import type { ReporterPlugin } from "./ReporterPlugin";
import type { Metric } from "Metrics/Metric";

export type WithReporter<
  T extends PluginTable = PluginTable,
  M extends Metric<any, any> = Metric<any, any>
> = T & {
  reporter?: ReporterPlugin<M>;
};

export type RequestFormatter<T> = (metrics: T[]) => XMLHttpRequestBodyInit;
