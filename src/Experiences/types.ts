import type { PluginTable } from "Metrics/types";
import type { Metric } from "Metrics/Metric";

export interface IExperience<
  T extends Metric<any, any>[] = Metric<any, any>[],
  P extends PluginTable = PluginTable,
> {
  name: string;
  metrics: T;
  plugins?: P;
}
