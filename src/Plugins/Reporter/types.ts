import type { PluginTable } from "Metrics/types";
import type { ReporterPlugin } from "./ReporterPlugin";
import type { Metric } from "Metrics/Metric";

export type WithReporter<
  T extends PluginTable = PluginTable,
  M extends Metric<any, any> = Metric<any, any>,
  C extends Record<string, any> = Record<string, any>
> = T & {
  reporter?: ReporterPlugin<M, C>;
};
