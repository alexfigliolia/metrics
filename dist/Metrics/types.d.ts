import type { Plugin } from "../Plugin/Plugin";
import type { Metric } from "./Metric";
export declare enum Status {
    idol = "idol",
    failed = "failed",
    inProgress = "inProgress",
    complete = "complete"
}
export declare enum CoreEvents {
    start = "start",
    stop = "stop",
    reset = "reset"
}
export interface MetricEvents<M extends Metric<any, any> = Metric<any, any>> {
    [CoreEvents.stop]: M;
    [CoreEvents.start]: M;
    [CoreEvents.reset]: M;
}
export type PluginTable = Record<string, Plugin | typeof Plugin>;
export type RegisteredPlugins<T extends PluginTable> = {
    [K in Extract<keyof T, string>]: T[K] extends typeof Plugin ? InstanceType<T[K]> : T[K];
};
