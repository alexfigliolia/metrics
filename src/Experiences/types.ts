import type { Metric } from "Metrics/Metric";
import type { PluginTable } from "Metrics/types";

export interface IExperience<
  T extends Metric<any, any>[] = Metric<any, any>[],
  P extends PluginTable = PluginTable
> {
  name: string;
  metrics: T;
  plugins?: P;
}
